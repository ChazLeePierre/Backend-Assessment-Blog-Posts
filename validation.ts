import { Request, Response, NextFunction } from "express";

import {
    check,
    validationResult,
    ValidationChain,
} from "express-validator";

/**
 * Returns Express middleware that checks if params are empty  
 *
 * @param {string[]} params The parameters to check
 * @return {ValidationChain[]} Middleware to check if params are empty
 */
function checkNotEmpty(params: string[]): ValidationChain[] {
    let validators: ValidationChain[] = [];
    for (const param of params) {
        validators.push(
            check(param).notEmpty().withMessage(`${param} parameter is required`)
        );
    }
    return validators;
}

/**
 * Returns Express middleware that checks if params are included in array
 *
 * @param {string} params The parameters to check
 * @param {string[]} array The array to be compared against
 * 
 * @return {ValidationChain[]} Middleware to check if params exist in array
 */
function checkIncludes(param: string, array: string[]): ValidationChain {
    return check(param)
        .isIn(array)
        .withMessage(`${param} parameter is invalid`);
}

/**
 * Validates the GET /api/posts route
 *
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @param {NextFunction} next The NextFunction function
 * 
 * @return {ValidationChain[]} Middleware to check if params exist in array
 */
export async function validateGetPosts(req: Request, res: Response, next: NextFunction) {
    let validations: ValidationChain[] = [];
    let requiredParams: string[] = ["tags"];
    let optionalParams = [
        {
            param: "sortBy",
            validValues: ["id", "reads", "likes", "popularity"],
        },
        {
            param: "direction",
            validValues: ["asc", "desc"],
        },
    ];

    // ensure required parameters are present
    validations.push(...checkNotEmpty(requiredParams));

    // ensure optional parameters are valid values
    for (const op of optionalParams) {
        validations.push(checkIncludes(op.param, op.validValues));
    }

    // verify validation chain
    await runValidations(req, res, next, validations);
}

/**
 * Runs the Validation Chain to catch potential errors
 *
 * @param {Request} req The Request object
 * @param {Response} res The Response object
 * @param {NextFunction} next The NextFunction function
 * 
 * @return {ValidationChain[]} Middleware to check if params exist in array
 */
const runValidations = async (req: Request, res: Response, next: NextFunction, validations: ValidationChain[]) => {
    // run all the validations in the validation chain
    for (let validation of validations) {
        const result = await validation.run(req);
        if (result.context.errors.length) break;
    }

    // capture potential errors, move onto the next function if none
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    // send the error with a 400 status back to the requestor 
    let error: string = errors.array({onlyFirstError: true})[0].msg;
    error = `${error.charAt(0).toUpperCase()}${error.substring(1, error.length)}`; 
    res.status(400).json({ error: error });
};
