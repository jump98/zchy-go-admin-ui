<template>
  <div>
    <el-form :inline="true">
      <!-- 快速查询 -->
      <el-form-item>
        <el-radio-group v-model="localTimeHours" size="mini" @input="onRadioInputEvent">
          <el-radio-button :label="1">1小时</el-radio-button>
          <el-radio-button :label="3">3小时</el-radio-button>
          <el-radio-button :label="6">6小时</el-radio-button>
          <el-radio-button :label="12">12小时</el-radio-button>
          <el-radio-button :label="24">1天</el-radio-button>
          <el-radio-button :label="24 * 3">3天</el-radio-button>
          <el-radio-button :label="24 * 7">7天</el-radio-button>
          <el-radio-button :label="24 * 14">14天</el-radio-button>
          <el-radio-button :label="24 * 30">30天</el-radio-button>
          <el-radio-button label="-1">自定义</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 自定义事件 -->
      <el-form-item v-if="localTimeHours == -1">
        <el-date-picker
          v-model="inputDate"
          size="mini"
          type="datetimerange"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          align="right"
          @change="onChangeInputTimeEvent"
        />
      </el-form-item>

      <!-- 时间类型 -->
      <el-form-item label="时间类型">
        <el-select v-model="localTimeType" size="mini" style="width: 80px" @change="onChangeTimeTypeEvent">
          <el-option v-for="item in timeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <!-- 数据类型 -->
      <el-form-item label="数据类型">
        <el-select v-model="localDataType" size="mini" style="width: 80px" @change="onChangeDataTypeEvent">
          <el-option v-for="item in dataTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "QueryParam",
  props: {
    /** 选择时间 */
    timeHours: {
      type: Number,
      default: () => 1
    },
    /** 数据类型[1=静态，2=动态[追加查询]] */
    dataType: {
      type: Number,
      default: () => 1
    },
    /** 时间颗粒度类型：[seconds,minutes,hours,days] */
    timeType: {
      type: String,
      default: () => "seconds"
    }
  },
  data() {
    return {
      /** 输入时间 */
      inputDate: [],
      dataTypeOptions: [
        {
          value: 1,
          label: "静态"
        },
        {
          value: 2,
          label: "动态"
        }
      ],
      timeTypeOptions: [
        {
          value: "seconds",
          label: "原始"
        },
        {
          value: "minutes",
          label: "按分"
        },
        {
          value: "hours",
          label: "按时"
        },
        {
          value: "days",
          label: "按天"
        }
      ],
      localTimeHours: this.timeHours,
      localDataType: this.dataType,
      localTimeType: this.timeType
    };
  },

  methods: {
    // 选择radio事件
    async onRadioInputEvent() {
      console.log("选择radio事件:", this.localTimeHours);
      if (this.localTimeHours == -1) return;
      this.emitChangeTimeEvent();
    },
    // 选择时间事件
    async onChangeInputTimeEvent() {
      console.log("选择时间事件:");
      this.emitChangeTimeEvent();
    },
    // 选择时间类型事件
    onChangeTimeTypeEvent() {
      this.emitChangeTimeEvent();
    },
    // 选择数据类型事件
    onChangeDataTypeEvent() {
      this.emitChangeTimeEvent();
    },

    // 获取选择的时间
    getQueryDate() {
      let localTimeHours = this.localTimeHours;
      let startTime = moment().subtract(localTimeHours, "hours"); // 查询往前多少个小时
      let endTime = moment();

      // 自定义时间
      if (localTimeHours == -1) {
        startTime = moment(this.inputDate[0]);
        endTime = moment(this.inputDate[1]);
      }
      return { startTime, endTime };
    },
    // 发送事件数据
    emitChangeTimeEvent() {
      let { startTime, endTime } = this.getQueryDate();
      let param = {
        startTime,
        endTime,
        dataType: this.localDataType,
        timeType: this.localTimeType,
        timeHours: this.localTimeHours
      };
      this.$emit("changeTimeEvent", param);
    }
  }
};
</script>
