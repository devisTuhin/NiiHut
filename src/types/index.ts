export type SearchParams = { [key: string]: string | string[] | undefined }

export type PageProps = {
  params: Promise<{ [key: string]: string }>
  searchParams: Promise<SearchParams>
}
