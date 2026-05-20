export interface Path{
    title: string,
    // link: URL
}

export interface PageData{
    id: number,
    type?: string,
    path: Array<Path>,
    title: string,
    data: Object
}