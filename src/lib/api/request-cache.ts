/**
 * Cache ngan han cho cac GET lap lai giua cac trang.
 *
 * Van de: danh sach workspace va role cua nguoi dung duoc goi lai o MOI trang,
 * du noi dung khong doi. Voi backend o xa (~260ms moi vong) thi day la thoi gian
 * cho thuan tuy.
 *
 * Cache nay giai quyet hai viec:
 * - Dedupe: nhieu component goi cung luc thi cung cho mot promise.
 * - TTL ngan: trong khoang TTL thi tra ve ngay tu bo nho, khong goi mang.
 *
 * Chi dung cho du lieu it doi. Danh sach task hay meeting thi KHONG nen cache o
 * day, vi nguoi dung can thay thay doi ngay sau khi tao hoac sua.
 */

type CacheEntry<T> = {
  /** Promise dang bay hoac da hoan tat, dung de dedupe cac lan goi trung. */
  promise: Promise<T>;
  /** Moc thoi gian ket thuc hieu luc. */
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export const DEFAULT_CACHE_TTL_MS = 60_000;

/**
 * Goi `fetcher` nhung tai su dung ket qua con hieu luc cho cung mot `key`.
 */
export function cachedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }

  const promise = fetcher().catch((error) => {
    // Khong giu lai loi trong cache, neu khong nguoi dung se mac ket voi loi cu
    // cho den khi het TTL du mang da phuc hoi.
    store.delete(key);
    throw error;
  });

  store.set(key, { promise, expiresAt: now + ttlMs });

  return promise;
}

/**
 * Xoa cache theo tien to. Goi sau khi ghi du lieu de lan doc ke tiep lay ban moi.
 */
export function invalidateCache(keyPrefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) {
      store.delete(key);
    }
  }
}

/** Xoa toan bo cache, dung khi dang xuat de khong ro ri du lieu sang phien khac. */
export function clearRequestCache() {
  store.clear();
}
