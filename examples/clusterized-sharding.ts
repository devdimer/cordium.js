import { ClusterManager, Intents } from "../build/index.js";

(async () => {
	// Instead of instantiating a normal Client, we will instantiate the ClusterManager
	const manager = new ClusterManager(
		"MTE1NzcyMDExNDMwMTUxNzkyNA.GyqSdV.H5bxTCTKBG6kJP-B0HUaSTVIVE7FhJsk-MR8VM",
		{
			// Set the required intents to receive message & guild related events.
			intents: [
				Intents.GUILD,
				Intents.GUILD_MESSAGES,
				Intents.GUILD_MEMBERS,
				Intents.MESSAGE_CONTENT,
			],
			sharding: {
				// The total number of shards that will be initialized.
				// Must be greater than the number of workers
				totalShards: 4,
			},
			clustering: {
				// The total number of workers that will be spawned.
				// Keep in mind that each worker (cluster) will have a specific number of shards and this number is measured as follows
				// (totalShards / totalWorkers) This means that the number of shards will be divided among all workers, therefore, there cannot be more workers than shards
				totalWorkers: 2,
			},
		},
	);
	await manager.init();

	// This event will be fired whenever a worker is spawned and will return an instance of ClusterClient
	// a ClusterClient is just an extended Client class that contains some new properties
	manager.events.workerSpawned.subscribe(async (client) => {
		// Subscribe to the "ready" event.
		// ready event will be fired when all shards are connected.
		client.events.ready.subscribe(() => {
			console.log(
				`I logged in as (${client.user?.username}) (PID=${process.pid})`,
			);
		});

		// Subscribe to the "shardReady" event.
		client.events.shardReady.subscribe((shard) => {
			console.log(`Shard connected: ${shard.id}/PID = ${process.pid}`);
		});

		// Subscribe to the "messageCreate" event.
		client.events.messageCreate.subscribe(async (message) => {
			// Ignore the command if is executed by a Bot.
			if (message.author.bot) return;

			if (message.content === "!ping") {
				// Send a message referenced by the author message.
				// client.shards.ping is an average of the ping of all connected shards, in this case a single shard.
				return await message.sendReference(
					`My ping is: \`${client.shards.ping}\`ms \nMy PID: \`${process.pid}\``,
				);
			}
		});

		// You need to initialize the client
		await client.init();
	});
})();
