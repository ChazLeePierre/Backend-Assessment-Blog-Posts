import { Request, Response, NextFunction } from "express";

import { AxiosResponse } from "axios";
import axios from "axios";

// BlogPost data model (interface)
import { IPost, IBlogPost } from "./models/BlogPost";

// validation middleware for routes
import { validateGetPosts } from "./validation.js";

import app from './app';

// Hostname to communinicate with Hatchways API
const HATCH_BASE_URL = "https://api.hatchways.io";

// "cache"
let blogPostCache: Map<number, IPost[]> = new Map();

// GET /api/ping
app.get("/api/ping", async (req: Request, res: Response) => {
    res.status(200).send({ success: true });
});

// GET /api/posts
app.get(
    "/api/posts",
    validateGetPosts,
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        // Stores data returned from the Hatchway API for current request
        let blogPosts: Map<string, IPost> = new Map<string, IPost>();

        // Parse search query params
        let params: any = (({ tags, sortBy, direction }) => ({ tags, sortBy, direction }))(req.query);
        let parsedTags = `${params.tags}`.split(',');

        // Generate cacheId based on search query params
        let cacheId: string = `${params.tags}-${params.sortBy}-${params.direction}`;

        // Check to see if cached result already exists
        const cachedBlogPosts: IPost[] = blogPostCache[cacheId];

        // If cached result exists, send back to user
        if (cachedBlogPosts) {
            res.status(200).send({ "posts": cachedBlogPosts });
            return;
        }

        for (const tag of parsedTags) {
            // Generate URL based on search query params
            let url = new URL(`${HATCH_BASE_URL}/assessment/blog/posts?tag=${tag}`);
            if (params.sortBy) url.searchParams.append('sortBy', `${params.sortBy}`);
            if (params.direction) url.searchParams.append('direction', `${params.direction}`);

            // Get posts data from the Hatchway API
            await axios.get<IBlogPost>(url.toString())
                .then(async (blogPostResponse: AxiosResponse<IBlogPost, any>) => {
                    for (const p of blogPostResponse.data.posts) {
                        // Store posts data into map to ensure no duplicates
                        let key: string = `${p.id}-${p[`${params.sortBy}`]}`;
                        blogPosts.set(key, p);
                    }
                }).catch((err) => {
                    res.status(500).send(err)
                });
        }

        // Determine sorting order based on direction parameter
        let asc: boolean = params.direction === 'asc';

        // Sort the blogPosts based on sortBy parameter
        let array = [...blogPosts]
            .sort((left, right) => {
                let l = parseFloat(left[0].split('-')[1]), r = parseFloat(right[0].split('-')[1]);
                return asc ? (l - r) : (r - l);
            }).map(bp => bp[1]);

        // Store final result in cache for future requests
        blogPostCache[`${params.tags}-${params.sortBy}-${params.direction}`] = array;

        // Return data back to requestor
        res.status(200).send({ "posts": array });
    }
);

export default app;