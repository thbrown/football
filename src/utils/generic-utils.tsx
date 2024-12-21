import { v4 as uuidv4 } from "uuid";

export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};
