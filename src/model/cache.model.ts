type CacheItemType = string | number | boolean | undefined;

class Cache {
  private cacheObject: { [key: string]: CacheItemType };
  private static instance: Cache;
  private constructor() {
    this.cacheObject = {};
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public get(cacheId: string): CacheItemType {
    return this.cacheObject[cacheId];
  }
  public put(cacheId: string, item: CacheItemType): boolean {
    this.cacheObject[cacheId] = item;
    return this.cacheObject[cacheId] === item;
  }
  public delete(cacheId: string): boolean {
    delete this.cacheObject[cacheId];
    return !!this.cacheObject[cacheId];
  }
}

export default Cache;
