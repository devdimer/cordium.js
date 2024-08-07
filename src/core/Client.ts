import { User } from "./classes/User";
import { ClientEvents } from "./events/ClientEvents";
import { GatewayManager, type ShardingOptions } from "./gateway/GatewayManager";
import { ClientCacheManager } from "./managers/ClientCacheManager";
import {
	RequestManager,
	type RequestManagerOptions,
} from "./rest/RequestManager";

export interface ClientOptions {
	/**
	 * The intents that will be sent to Discord gateway
	 */
	intents: number | number[];

	/**
	 * Request manager options
	 */
	rest: RequestManagerOptions;

	/**
	 * Gateway manager options
	 */
	sharding: ShardingOptions;
}

/**
 * Represents a socket based Client.
 */
export class Client {
	/**
	 * @protected
	 *
	 * The Discord authorization token.
	 */
	#token: string;

	/**
	 * Utility class to handle all HTTPS requests to Discord API.
	 */
	public rest: RequestManager;

	/**
	 * Gateway manager, handle all shards connection.
	 */
	public shards: GatewayManager;

	/**
	 * Whether has completed the initialization setup and is fully connected to Discord gateway.
	 */
	public ready: boolean;

	/**
	 * Client options to customize every thing, such as API version, URLs, sharding, etc...
	 */
	public options: ClientOptions;

	/**
	 * Client cache utility will store Guild objects when received from Discord gateway and API,
	 */
	public cache: ClientCacheManager;

	/**
	 * The client user.
	 */
	public user?: User;

	/**
	 * All events received from Discord gateway and other utility events.
	 */
	public events: ClientEvents;

	/**
	 * ```ts copy showLineNumbers
	 * new Client("token", { sharding: { totalShards: 2 } });
	 * ```
	 */
	public constructor(token: string, options?: Partial<ClientOptions>) {
		if (!token || typeof token !== "string")
			throw new Error("Client(token): token is missing or is not a string.");

		this.options = {
			intents:
				(Array.isArray(options?.intents)
					? options.intents?.reduce((acc, curr) => acc + curr, 0)
					: options?.intents) || 513,
			rest: {
				apiVersion: options?.rest?.apiVersion || 10,
				alwaysSendAuthorizationHeader:
					options?.rest?.alwaysSendAuthorizationHeader || false,
			},
			sharding: {
				gatewayUrl:
					options?.sharding?.gatewayUrl || "wss://gateway.discord.gg/",
				totalShards: options?.sharding?.totalShards || 1,
				connectOneShardAtTime: options?.sharding?.connectOneShardAtTime || true,
				firstShardId: options?.sharding?.firstShardId || 0,
				lastShardId:
					options?.sharding?.lastShardId || options?.sharding?.totalShards || 1,
			},
		};

		this.#token = token;
		this.rest = new RequestManager(this, this.#token);
		this.shards = new GatewayManager(this, this.#token);
		this.cache = new ClientCacheManager(this);
		this.ready = false;
		this.events = new ClientEvents();
	}

	/**
	 * Get and set the client user object.
	 *
	 * ```ts copy showLineNumbers
	 * await client.getMe();
	 * console.log(client.user);
	 * ```
	 *
	 * ```ts copy showLineNumbers
	 * const user = await client.getMe();
	 * console.log(user);
	 * ```
	 */
	public async getMe(): Promise<User> {
		const me = await this.rest.request({
			method: "get",
			endpoint: "/users/@me",
			auth: true,
		});

		this.user = new User(this, me.data);
		return this.user;
	}

	/**
	 * Start the initialization process, first it will try to catch the user itself, then it will connect all the shards.
	 *
	 * ```ts copy showLineNumbers
	 * await client.init();
	 * ```
	 */
	public async init() {
		try {
			await this.getMe();
			this.shards.init();
		} catch (_) {
			console.log(_);
		}
	}
}
