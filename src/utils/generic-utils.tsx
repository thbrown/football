import { v4 as uuidv4 } from "uuid";
import { generate } from "random-words";
import { ConnectionSpecification } from "../types/context-types";
import { LocalInfoHost, LocalInfoTaster } from "../types/local-info-types";

export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};

export const createNewHostRoom = (): ConnectionSpecification => {
  console.log("Creating new room");
  return {
    roomId: getWords(3),
    roomPwd: uuidv4(),
    localId: "host",
    localPwd: uuidv4(),
  };
};

export const getFreshLocalInfoHost = (): LocalInfoHost => {
  const newLocalInfo: LocalInfoHost = {
    type: "host",
    qrId: getWords(3),
    qrPwd: uuidv4(),
    wines: {},
    tasters: {},
  };
  return newLocalInfo;
};

export const getFreshLocalInfoTaster = (): LocalInfoTaster => {
  const newLocalInfo: LocalInfoTaster = {
    type: "taster",
    name: "",
    winesToTaste: {},
    wineTastings: [],
  };
  return newLocalInfo;
};

export const getWords = (count: number): string => {
  return (generate(3) as string[]).join("-");
};

export const getNextLetter = (index: number): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const base = alphabet.length;

  let result = "";

  while (index >= 0) {
    const remainder = index % base;
    result = alphabet[remainder] + result;

    index = Math.floor(index / base) - 1;
  }

  return result;
};

export const toUrlPath = (
  connectionSpec: ConnectionSpecification,
  isHost: boolean
): string => {
  return `/connect?roomId=${connectionSpec.roomId}&roomPwd=${connectionSpec.roomPwd}&localId=${connectionSpec.localId}&localPwd=${connectionSpec.localPwd}&isHost=${isHost}`;
};
