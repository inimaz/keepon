import { JSONFilePreset } from "lowdb/node";

export default async function (sourceFile: string): Promise<any> {
  return await JSONFilePreset(sourceFile, { tasks: [] });
}
