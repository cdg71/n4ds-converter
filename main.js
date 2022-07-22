console.time(`Durée d'exécution`);

import crypto from "crypto";
import { EventEmitter } from "events";
import fs from "fs";
import papa from "papaparse";
import path from "path";
import slugify from "slugify";

const NEWLINE = "\r\n";
const ORGANISATION_DEFAULTS = {
  UID: undefined,
  SIRENE: undefined,
  name: undefined,
  NAF: undefined,
  SIRET: undefined,
  header: [],
  buffer: [],
};
const inputFile = path.normalize(process.argv[2]);
const outputFolder = path.normalize(process.argv[3]);

fs.mkdirSync(outputFolder);
const inputStream = fs.createReadStream(inputFile, { encoding: "latin1" });
const indexStream = fs.createWriteStream(`${outputFolder}/index.csv`, {
  encoding: "latin1",
});
indexStream.write(
  papa.unparse(
    { data: ["SIRET", "COLLECTIVITE", "FICHIER"] },
    {
      quoteChar: '"',
      delimiter: ";",
    }
  ) + NEWLINE
);

let organisationStream;
let currentOrganisation;
let organisationFilename;
let organisationsCount = 0;

papa.parse(inputStream, {
  worker: true,
  step: function (currentRow) {
    try {
      const currentRowIdentifier = currentRow.data[0];
      switch (currentRowIdentifier) {
        case "S20.G01.00.001": // Organisation SIRENE : a new value means that it's a new organisation
          if (isWritableStream(organisationStream))
            closeStream(organisationStream);
          resetOrganisationWith(currentRow);
          break;

        case "S20.G01.00.002": // Organisation name
          currentOrganisation.name = getCurrentRowValue(currentRow);
          currentOrganisation.buffer.push({ ...currentRow });
          break;

        case "S20.G01.00.008": // Organisation NAF : we are ready to write a new organisation file
          currentOrganisation.buffer.push({ ...currentRow });
          currentOrganisation.NAF = getCurrentRowValue(currentRow);
          currentOrganisation.SIRET = `${currentOrganisation.SIRENE}${currentOrganisation.NAF}`;
          organisationFilename = slugify(
            `${currentOrganisation.SIRET}_${currentOrganisation.name}_${currentOrganisation.UID}.csv`
          );
          indexStream.write(
            papa.unparse(
              {
                data: [
                  currentOrganisation.SIRET,
                  currentOrganisation.name,
                  organisationFilename,
                ],
              },
              {
                quoteChar: '"',
                delimiter: ";",
              }
            ) + NEWLINE
          );
          createStream(organisationFilename);
          currentOrganisation.header = [
            { data: ["S00.00.00", `'${currentOrganisation.SIRET}'`] },
            { data: ["S10.G01.00.001.001", `'${currentOrganisation.SIRENE}'`] },
            { data: ["S10.G01.00.001.002", `'${currentOrganisation.NAF}'`] },
          ];
          currentOrganisation.header.forEach((headerRow) => {
            organisationStream.write(papa.unparse(headerRow) + NEWLINE);
          });
          currentOrganisation.buffer.forEach((bufferRow) => {
            organisationStream.write(papa.unparse(bufferRow) + NEWLINE);
          });
          break;

        default:
          if (currentOrganisation && currentOrganisation.SIRENE) {
            if (currentOrganisation.NAF) {
              // the header has been written, write the line
              organisationStream.write(papa.unparse(currentRow) + NEWLINE);
            } else {
              // the header has not been written : buffer the line
              currentOrganisation.buffer.push({ ...currentRow });
            }
          }
          break;
      }
    } catch (error) {
      console.log(error);
      if (isWritableStream(organisationStream)) closeStream(organisationStream);
      if (isWritableStream(indexStream)) closeStream(indexStream);
    }
  },
  complete: function () {
    console.log(`${organisationsCount} fichier(s) généré(s)`);
    console.timeEnd(`Durée d'exécution`);
    if (isWritableStream(organisationStream)) closeStream(organisationStream);
    if (isWritableStream(indexStream)) closeStream(indexStream);
    console.log("");
  },
});

function createStream(filename) {
  organisationStream = fs.createWriteStream(`${outputFolder}/${filename}`, {
    encoding: "latin1",
  });
}

function getCurrentRowValue(currentRow) {
  return currentRow.data[1].slice(1, -1);
}

function closeStream(stream) {
  {
    stream.end();
    stream = undefined;
  }
}

function resetOrganisationWith(row) {
  organisationsCount = organisationsCount + 1;
  currentOrganisation = {
    ...ORGANISATION_DEFAULTS,
    UID: crypto.randomBytes(8).toString("hex"),
    SIRENE: getCurrentRowValue(row),
    buffer: [{ ...row }],
  };
}

function isWritableStream(testedVariable) {
  return (
    testedVariable instanceof EventEmitter &&
    typeof testedVariable.write === "function" &&
    typeof testedVariable.end === "function"
  );
}
