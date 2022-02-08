export interface IPost {
    id: number;
    author: string;
    authorId: number;
    likes: number;
    popularity: number;
    reads: number;
    tags: string[];
}

export interface IBlogPost {
    posts: IPost[];
}


