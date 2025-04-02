export class DatabaseTestContext {
    private cleanupFuncs: (() => Promise<void>)[];

    constructor(){
        this.cleanupFuncs = [];
    }

    public addCleanupFunction(func: () => Promise<void>): void {
        if (!this.cleanupFuncs.includes(func)) {
            this.cleanupFuncs.push(func);
        }
    }

    public async executeCleanupFunctions(): Promise<void> {
        // The earlier added functions are the more base entites that have fewer dependencies,
        // to avoid non-null constraints when deleting entites, we delete the most recently added/build entites
        // as they depend on already existing entites, so should be taken down in the same order
        for (let i = this.cleanupFuncs.length - 1; i >= 0; i--) {
            await this.cleanupFuncs[i]();
        }
    }
}