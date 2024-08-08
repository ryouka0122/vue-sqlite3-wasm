import {ref} from "vue";
import type {TodoTaskEntity} from "@/clients/TodoTaskClient";
import {PriorityMaster} from "@/constants";

/**
 * データテーブルComposition
 */
function taskTableComposition() {

  // テーブルで扱うデータ
  const dataList = ref<TodoTaskEntity[]>([])

  /**
   * 日付の出力
   * @param date
   */
  const printDate = (date: Date) => {
    return date.toLocaleDateString()
  }

  /**
   * 優先順の出力
   * @param priority
   */
  const printPriorityLabel = (priority: number) => {
    return PriorityMaster.filter(p => p.value === priority)[0].label
  }
  return {
    dataList,
    printDate,
    printPriorityLabel,
  }
}

export {
  taskTableComposition
}