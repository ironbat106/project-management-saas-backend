import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { TeamService } from "./team.service.js";
 
const createTeam = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.createTeam(req.params.organizationId, req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Team created successfully",
    data: result,
  });
});
 
const getTeams = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.getTeams(req.params.organizationId, req.query, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Teams fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const addTeamMember = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.addTeamMember(req.params.teamId, req.body.userId, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Member added to team successfully",
    data: result,
  });
});
 
const removeTeamMember = catchAsync(async (req: Request, res: Response) => {
  await TeamService.removeTeamMember(req.params.teamId, req.params.userId, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member removed from team successfully",
    data: null,
  });
});
 
export const TeamController = {
  createTeam,
  getTeams,
  addTeamMember,
  removeTeamMember,
};
