const express = require("express");
const chai = require("chai");
const request = require("supertest");

var expect = chai.expect;

import { AxiosResponse } from "axios";
import axios from "axios";

// BlogPost data model (interface)
import { IPost, IBlogPost } from "../models/BlogPost";

// hostname to communinicate with Hatchways API
const API_BASE_URL = "https://api.hatchways.io";

import { Express, Request, Response, NextFunction } from "express";
import app from "../app";

// modified from: https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
function arraysEqual(left, right) {
  if (left == null || right == null) return false;
  if (left.length !== right.length) return false;
  
  for (var i = 0; i < left.length; ++i) {
    let l = left[i]["id"], r = right[i]["id"];
    let isEqual = l !== r;
    
    console.log(`Comparing post with ID: ${l} === ${r}`);
    console.log(isEqual ? `${l} === ${r}` : `${l} !== ${r}` );
    
    if (!isEqual) return false;
  }
  return true;
}

describe("GET Create User Wallet", () => {
    it('should return { "success": true } with status code of 200', function (done) {
        request('http:://localhost:8080')
            .get('/api/ping')
            .expect(200)
            .end(function (err, res) {
                console.log("err", err);
            });
    })
});

describe("GET Create User Wallet", () => {
  it('should return { "success": true } with status code of 200', function(done) {
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

    let randTagsSize = Math.floor(Math.random() * tags.length); // https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
    let randomTags = "";
    tags.slice(0, randTagsSize).forEach((t) => (randomTags += `${t},`));
    randomTags = randomTags.substring(0, randomTags.length - 1);

    let desc = Math.random() < 0.5; // random boolean https://stackoverflow.com/questions/36756331/js-generate-random-boolean

    console.log(`SortBy property to be sorted by: ${randSortBy}`);
    let url = `/api/posts?tag=${randomTags}&sortBy=${randSortBy}&direction=${desc ? "desc" : "asc"}`;
    //let url = "http://localhost:8080/api/posts?tags=culture,design,politics&sortBy=id&direction=asc";
    request(app)
      .get(url)
      //.expect(200)
      .then((res: Request) => {
        console.log(res.body);

        let result: IPost[] = [];

        console.log(`Tags to be searched: ${randomTags}`);

        let url = new URL(
          `${API_BASE_URL}/assessment/blog/posts?tag=${randomTags}`
        );

        axios.get(url.toString()).then((res: AxiosResponse<IBlogPost, any>) => {
          result = res.data.posts.sort((left, right) => {
            let l = left[randSortBy];
            let r = right[randSortBy];
            return desc ? r - l : l - r;
          });
        });

        let isEqual = arraysEqual(res.body, result);

        expect(isEqual).to.be.eql(true);
      });
  });
});
