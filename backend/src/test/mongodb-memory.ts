import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet: MongoMemoryReplSet | undefined;

export async function startTestMongoReplicaSet() {
  replSet ??= await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  return {
    replSet,
    uri: replSet.getUri(),
  };
}

export async function stopTestMongoReplicaSet() {
  await replSet?.stop();
  replSet = undefined;
}
