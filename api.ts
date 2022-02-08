import { Request, Response, NextFunction } from "express";

import { AxiosResponse } from "axios";
import axios from "axios";

// BlogPost data model (interface)
import { IPost, IBlogPost } from "./models/BlogPost";

// validation middleware for routes
import { validateGetPosts } from "./validation.js";

import app from './app';

// hostname to communinicate with Hatchways API
const API_BASE_URL = "https://api.hatchways.io";

// "cache", alternatively I would use Redis but I'm working on a Windows environment
// & didn't want to switch over to a virtual machine or Windows Subsystem for Linux
let blogPostCache: Map<number, IPost[]> = new Map();

// default HTTP port
const HTTP_PORT = 8080;

// call this function after the http server starts listening for requests
app.listen(HTTP_PORT, () => {
    console.log("Express http server listening on: " + HTTP_PORT);
});

// setup a route on the 'root' of the url
// IE: http://localhost:8080/
app.get("/api/ping", async (req: Request, res: Response) => {
    res.status(200).send({ success: true });
});

// now add a route for the /headers page
// IE: http://localhost:8080/headers
app.get(
    "/api/posts",
    validateGetPosts,
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        let blogPosts: Map<string, IPost> = new Map<string, IPost>();
        let params: any = (({ tags, sortBy, direction }) => ({ tags, sortBy, direction }))(req.query);
        let cacheId: string = `${params.tags}-${params.sortBy}-${params.direction}`;

        let parsedTags = `${params.tags}`.split(',');

        const cachedBlogPosts: IPost[] = blogPostCache[cacheId];

        if (cachedBlogPosts) {
            res.status(200).send({ "posts": cachedBlogPosts });
            return;
        }

        for (const tag of parsedTags) {
            let url = new URL(`${API_BASE_URL}/assessment/blog/posts?tag=${tag}`);
            if (params.sortBy) url.searchParams.append('sortBy', `${params.sortBy}`);
            if (params.direction) url.searchParams.append('direction', `${params.direction}`);

            await axios.get<IBlogPost>(url.toString())
                .then(async (blogPostResponse: AxiosResponse<IBlogPost, any>) => {
                    for (const p of blogPostResponse.data.posts) {
                        let key: string = `${p.id}-${p[`${params.sortBy}`]}`;
                        blogPosts.set(key, p);
                    }
                }).catch((err) => {
                    res.status(500).send(err)
                });
        }

        let asc: boolean = params.direction === 'asc';

        let array = [...blogPosts]
            .sort((left, right) => {
                let l = parseFloat(left[0].split('-')[1]), r = parseFloat(right[0].split('-')[1]);
                return asc ? (l - r) : (r - l);
            }).map(bp => bp[1]);

        blogPostCache[`${params.tags}-${params.sortBy}-${params.direction}`] = array;

        res.status(200).send({ "posts": array });
    }
);