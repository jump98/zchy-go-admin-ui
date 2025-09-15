import { alarm } from "./alarm";
import { dept } from "./dept";
import { radar } from "./radar";
import { radarPoint } from "./radar_point";

export const Dept = new dept();
export const Alarm = new alarm();
export const Radar = new radar();
export const RadarPoint = new radarPoint();

/** 弹窗类型 */
export const PopActionType = {
  UNDEFINED: 0,
  /** 编辑 */
  EDIT: 1,
  /** 新增 */
  ADD: 2
};
