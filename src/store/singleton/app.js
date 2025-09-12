import { alarm } from "./alarm";
import { dept } from "./dept";

export const Dept = new dept();
export const Alarm = new alarm();

/** 弹窗类型 */
export const PopActionType = {
  UNDEFINED: 0,
  /** 编辑 */
  EDIT: 1,
  /** 新增 */
  ADD: 2
};
