interface Options {
  notFoundOk: boolean;
}

export async function jsonFetcher<T>(url: string, options: Options = { notFoundOk: true}): Promise<T | null> {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404 && options.notFoundOk) {
      return null;
    }
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }

  return res.json();
};

export async function jsonFetcherWithLastModified<T>(url: string, options: Options = { notFoundOk: true}): Promise<{ data: T, lastModified: string | null } | null> {
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404 && options.notFoundOk) {
      return null;
    }
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }

  return {
    lastModified: res.headers.get("Last-Modified"),
    data: await res.json(),
  };
}

export async function csvFetcher(url: string): Promise<string> {
  return (await fetch(url)).text();
}