import { Express, Request, Response, NextFunction } from "express";

import {
    check,
    query,
    validationResult,
    ValidationChain,
} from "express-validator";

// Validation helper functions

function checkNotEmpty(params: string[]): ValidationChain[] {
    let validators: ValidationChain[] = [];
    for (const param of params) {
        validators.push(
            check(param).notEmpty().withMessage(`${param} cannot be empty.`)
        );
    }
    return validators;
}

function checkIncludes(param: string, array: string[]): ValidationChain {
    return check(param)
        .isIn(array)
        .withMessage(`${param} is not an valid value.`);
}

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

    // tags

    // ensure optional parameters are valid values
    for (const op of optionalParams) {
        validations.push(checkIncludes(op.param, op.validValues));
    }

    await runValidations(req, res, next, validations);
}

const runValidations = async (req: Request, res: Response, next: NextFunction, validations: ValidationChain[]) => {
    for (let validation of validations) {
        const result = await validation.run(req);
        if (result.context.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    res.status(400).json({ errors: errors.array() });
};
