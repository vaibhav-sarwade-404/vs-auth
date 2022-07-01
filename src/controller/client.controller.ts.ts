import { NextFunction, Request, Response } from "express";
import HttpException from "../model/HttpException";
import RequestValidationError from "../model/RequestValidationError.Model";
import clientsService from "../service/clients.service";
import { CreateClientRequest } from "../types/Request";

import { Logger } from "../utils/logger";

const fileName = `client.controller`;

const createClient = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${createClient.name}`);
  const { clientName } = req.body as CreateClientRequest;
  try {
    const client = await clientsService.createClient(
      req.body as CreateClientRequest
    );
    return resp.status(200).json(client);
  } catch (error) {
    logger.error(
      `Something went wrong while creating new application(${clientName}) with error${error}`
    );
    next(new HttpException(500, "Something went wrong"));
  }
};
const getClient = async (req: Request, resp: Response, next: NextFunction) => {
  const logger = new Logger(`${fileName}.${getClient.name}`);
  const { clientId } = req.params;
  try {
    const client = await clientsService.getClientByClientId(clientId);
    resp.status(200).json(client);
  } catch (error) {
    logger.error(
      `Something went wrong while getting application(${clientId}) with error:${error}`
    );
    next(new HttpException(500, "Something went wrong"));
  }
};
const updateClient = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${updateClient.name}`);
  const { clientId } = req.params;
  try {
    const client = await clientsService.updateClient(clientId, req.body);
    return resp.status(200).send(client);
  } catch (error) {
    logger.error(
      `Something went wrong while updating application(${clientId}) with error:${error}`
    );
    next(new HttpException(500, "Something went wrong"));
  }
};
const deleteClient = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${deleteClient.name}`);
  const { clientId } = req.params;
  try {
    const client = await clientsService.deleteClient(clientId);
    return resp.status(200).send(client);
  } catch (error) {
    logger.error(
      `Something went wrong while deleting application(${clientId}) with error:${error}`
    );
    next(new HttpException(500, "Something went wrong"));
  }
};
const rotateClientSecret = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const logger = new Logger(`${fileName}.${rotateClientSecret.name}`);
  const { clientId } = req.params;
  try {
    const client = await clientsService.rotateClientSecret(clientId);
    if (!client) {
      logger.error(
        `cannot rotate client secret for client(${clientId}), clientId not found`
      );
      const validationError = new RequestValidationError();
      validationError.addError = {
        field: "clientId",
        error: `clientId is invalid`
      };
      next(validationError);
    }
    return resp.status(200).send(client);
  } catch (error) {
    logger.error(
      `Something went wrong while rotating secrete of application(${clientId}) with error:${error}`
    );
    next(new HttpException(500, "Something went wrong"));
  }
};

export default {
  createClient,
  getClient,
  updateClient,
  deleteClient,
  rotateClientSecret
};
