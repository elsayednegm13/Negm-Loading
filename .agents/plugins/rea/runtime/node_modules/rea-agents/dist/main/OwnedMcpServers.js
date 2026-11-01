/** Own the exact close capabilities of every published SDK instance. */
export class OwnedMcpServers {
    servers = new Map();
    accepting = true;
    create(factory) {
        if (!this.accepting)
            throw new Error("MCP connection is closed");
        const server = factory();
        const close = server.close.bind(server);
        const ownedClose = async () => {
            await close();
            this.servers.delete(server);
        };
        this.servers.set(server, ownedClose);
        server.close = ownedClose;
        return server;
    }
    /** Seal publication before snapshotting; failed close capabilities stay owned. */
    closeAll() {
        this.accepting = false;
        return Promise.allSettled([...this.servers.values()].map((close) => Promise.resolve().then(close)));
    }
}
