import { Request } from "express";
const express = require("express");
import app from "../api";

const request = require("supertest");
const chai = require("chai");
var expect = chai.expect;

import { AxiosResponse } from "axios";
import axios from "axios";

// BlogPost data model (interface)
import { IPost, IBlogPost } from "../models/BlogPost";

// Hostname to communicate with Hatchways API
const HATCH_BASE_URL = "https://api.hatchways.io";

/**
 * Returns whether the arrays are equal or not 
 * by comparing the ID of each element in the array
 * 
 * Modified from: https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
 *
 * @param {IPost[]} left The first array to compare.
 * @param {number} right The second array to be compared against.
 * @return {number} Whether the arrays are equal
 */
function arraysEqual(left: IPost[], right: IPost[]) {
  if (left == null || right == null) return false;
  if (left.length !== right.length) return false;

  for (var i = 0; i < left.length; ++i) {
    let l = left[i]["id"],
      r = right[i]["id"];
    let isEqual = l === r;

    if (!isEqual) return false;
  }
  return true;
}

// GET api/ping
describe("GET api/ping", () => {
  it('should return { "success": true } with status code of 200', function (done) {
    request(app)
      .get("/api/ping")
      .expect(200, done)
  });
});

// GET api/posts?tags=
describe("GET api/posts with no tags parameter", () => {
  it('should return { "error": "Tags parameter is required" } with status code of 400', function (done) {
    request(app)
        .get("/api/posts?sortBy=id&direction=asc")
        .expect(400)
        .then((response) => {
          let error =
            response.body?.error !== null && response.body?.error !== undefined;
          expect(error).to.be.eql(true);
          expect(response.body.error).to.be.eql("Tags parameter is required");
          done();
        });
  });
});

// GET api/posts?sortBy=invalid
describe("GET api/posts with invalid sortBy parameter", () => {
  it('should return { "error": "SortBy parameter is invalid" } with status code of 400', function (done) {
    request(app)
        .get("/api/posts?tags=tech,science&sortBy=invalid&direction=asc")
        .expect(400)
        .then((response) => {
          let error =
            response.body?.error !== null && response.body?.error !== undefined;
          expect(error).to.be.eql(true);
          expect(response.body.error).to.be.eql("SortBy parameter is invalid");
          done();
        });
  });
});

// GET api/posts?direction=invalid
describe("GET api/posts with invalid direction parameter", () => {
  it('should return { "error": "Direction parameter is invalid" } with status code of 400', function (done) {
    request(app)
      .get("/api/posts?tags=tech,science&sortBy=id&direction=sideways")
      .expect(400)
      .then((response) => {
        let error =
          response.body?.error !== null && response.body?.error !== undefined;
        expect(error).to.be.eql(true);
        expect(response.body.error).to.be.eql("Direction parameter is invalid");
        done();
      });
  });
});

// GET api/posts?tags=${tags}&sortBy=${sortBy}&direction=${direction}
describe("GET api/posts | check to see if data source & API return same content using random parameters", () => {
  it('should get data from both APIs, sort it, compare for equality', function (done) {
    // get random direction to pass to API calls
    let desc: boolean = Math.random() < 0.5;

    // get random sortBy parameter to pass to API calls
    let sortBy = ["id", "reads", "likes", "popularity"];
    let randSortIndex = Math.floor(Math.random() * sortBy.length);
    let randSortBy = sortBy[randSortIndex];

    let tags = [
      "science",
      "design",
      "history",
      "culture",
      "startups",
      "tech",
      "politics",
    ];

    // get random tags parameter to pass to API calls
    let randTagsSize = Math.floor(Math.random() * tags.length);
    let randomTags = "";
    tags.slice(0, randTagsSize).forEach((t) => (randomTags += `${t},`));
    randomTags = randomTags.substring(0, randomTags.length - 1);
    let url = `/api/posts?tags=${randomTags}&sortBy=${randSortBy}&direction=${desc ? "desc" : "asc"}`;
    let randomTagsArr = randomTags.split(",");

    // GET localhost:8080/api/posts with params
    request(app)
      .get(url)
      .expect(200)
      .then(async (res: Request) => {
        let hatchwayPosts: Map<number, IPost> = new Map<number, IPost>();

        // stores the results from the Hatchway API
        for (const randTag of randomTagsArr) {
          await axios
            .get(`${HATCH_BASE_URL}/assessment/blog/posts?tag=${randTag}`)
            .then((res: AxiosResponse<IBlogPost, any>) => {
              for (const post of res.data.posts) {
                hatchwayPosts.set(post.id, post);
              }
            });
        }

        let hatchwayPostsArr: IPost[] = [];

        // convert map into array for sorting
        hatchwayPosts.forEach((post) => {
          hatchwayPostsArr.push(post);
        });

        // sort array based on the sortBy parameter
        hatchwayPostsArr.sort((left, right) => {
          let l = left[randSortBy];
          let r = right[randSortBy];
          return desc ? r - l : l - r;
        });

        // confirm if local API results are equal to Hatchway API results
        let isEqual = arraysEqual(res.body.posts, hatchwayPostsArr);

        expect(isEqual).to.be.eql(true);
        done();
      })
      .catch((err) => done(err));
  });
});
