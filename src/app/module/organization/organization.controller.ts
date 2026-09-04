import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { OrganizationService } from "./organization.service.js";
 
const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.createOrganization(req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Organization created successfully",
    data: result,
  });
});
 
const getOrganizations = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.getOrganizations(req.query, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organizations fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const getSingleOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.getSingleOrganization(req.params.id, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization fetched successfully",
    data: result,
  });
});
 
const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.updateOrganization(req.params.id, req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization updated successfully",
    data: result,
  });
});
 
const deleteOrganization = catchAsync(async (req: Request, res: Response) => {
  await OrganizationService.deleteOrganization(req.params.id, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization deleted successfully",
    data: null,
  });
});
 
export const OrganizationController = {
  createOrganization,
  getOrganizations,
  getSingleOrganization,
  updateOrganization,
  deleteOrganization,
};
