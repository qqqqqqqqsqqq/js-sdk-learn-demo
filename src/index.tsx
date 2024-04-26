import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  bitable,
  CurrencyCode,
  IField,
  ISingleSelectField,
  ICurrencyField,
  ICurrencyFieldMeta,
  IOpenCellValue,
  IOpenTimestamp,
  IRecord,
  FilterOperator,
  IOpenUser,
  FilterConjunction
} from '@lark-base-open/js-sdk';
import { MetaItem } from './types';
import { Alert, AlertProps, Button, Select } from 'antd';
import { CURRENCY } from './const';
import { getExchangeRate } from './exchange-api';
import List from './list'; // 引入 List.tsx 文件
import SearchUser from './searchUser';
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <LoadApp />
    </React.StrictMode>
)

function LoadApp() {
  const [titleField, setTitleField] = useState<IField>();
  const [descirbeField, setDescribeField] = useState<IField>();
  const [lastTimeField, setLastTimeField] = useState<IField>();
  const [acceptorField, setAcceptorField] = useState<IField>();
  const [currencyFieldMetaList, setMetaList] = useState<ICurrencyFieldMeta[]>([])
  const [selectFieldId, setSelectFieldId] = useState<string>();
  const [currency, setCurrency] = useState<CurrencyCode>();
  const [titleFieldMetaList, setTitleList] = useState<(IRecord | undefined)[]>([])
  useEffect(() => {
    const fn = async () => {
      console.log('LoadApp component is mounted'); // 组件挂载时打印日志
      const table = await bitable.base.getActiveTable();
      const tableName = await table.getName();
      const lastTimeField = await table.getFieldByName("实际完成日期")
      const describeField = await table.getFieldByName("任务描述")
      const titleField = await table.getFieldByName("标题")
      const acceptorField = await table.getFieldByName("验收人员")
      setLastTimeField(lastTimeField);
      setDescribeField(describeField);
      setTitleField(titleField);
      setAcceptorField(acceptorField);
      const status: ISingleSelectField = await table.getFieldByName("进展")
      const statusOptions = await status.getOptions();
      const statusOption = statusOptions.filter(item => item.name === "已完成")

      // const t = await bitable.base.getActiveTable();
      const v = await table.getActiveView(); // 表格视图
      // 过滤出多行文本包含 123 的记录 id
      const recordIdList = await v.getVisibleRecordIdList({
        conjunction:  FilterConjunction.And,
        conditions: [
          {
            fieldId: status.id,
            operator: FilterOperator.Is,
            value: statusOption[0].id
          }
        ],
      }, [{
        fieldId: lastTimeField.id,
        desc: true
      }]);


      const { records } = await table.getRecords({
        pageSize: 5000
      })
      const myRecords = recordIdList.map(recordId => records.find(item => (item.recordId === recordId)));
      const filteredRecords = myRecords.filter((record: IRecord | undefined, index: number) => {
        if (record) {
          // 在这里进行类型断言，确保 record 是 IRecord 类型
          const { recordId, fields } = record;
          return recordIdList.includes(recordId);
        }
        return false;
      });
      setTitleList(filteredRecords);

    };
    fn();
  }, []);
  const formatFieldMetaList = (metaList: ICurrencyFieldMeta[]) => {
    return metaList.map(meta => {
      return { label: meta.name, value: meta.id };
    });
  };


  const formatTitleFieldMetaList = (metaList: IRecord[]): MetaItem[] => {
    return metaList.map(meta => {

      const title:IOpenCellValue = (meta.fields[titleField.id][0] as IOpenCellValue);
      const descirbe:IOpenCellValue = (meta.fields[descirbeField.id][0] as IOpenCellValue);
      const acceptor:IOpenUser[] = (meta.fields[acceptorField.id][0] as IOpenUser[]);

      const lastTime = meta.fields[lastTimeField.id]
      // console.log(lastTimeField)
      // console.log(meta)
      return {
        [meta.recordId]: {
          title: title.text,
          description: descirbe.text,
          acceptor: acceptor,
          lastTime: lastTime === null ? "" : new Date(lastTime).toLocaleString(),
        }
      };
    });
  };
  const fetchRecentData = (selectedItems: number[]) => {
    // 在这里处理提交逻辑，例如发送选中的项到服务器
    console.log(selectedItems);
    // 在这里可以进行进一步的处理
  };
  const bindUser = () => {
    // 在这里可以进行绑定用户的其他操作，例如发送API请求等
  };


  const transform = async () => {
    if (!selectFieldId || !currency) return;
    const table = await bitable.base.getActiveTable();
    const currencyField = await table.getField<ICurrencyField>(selectFieldId);
    const currentCurrency = await currencyField.getCurrencyCode();
    await currencyField.setCurrencyCode(currency);
    const ratio = await getExchangeRate(currentCurrency, currency);
    if (!ratio) return;
    const recordIdList = await table.getRecordIdList();
    for (const recordId of recordIdList) {
      const currentVal = await currencyField.getValue(recordId);
      await currencyField.setValue(recordId, currentVal * ratio);
    }
  }

  return <div>
    <div style={{ margin: 10 }}>
      <SearchUser />
      <div>获取最近表单填写记录</div>
      <Select style={{ width: 120 }} onSelect={setTitleList} options={formatTitleFieldMetaList(titleFieldMetaList)} />
    </div>
    <List listData={formatTitleFieldMetaList(titleFieldMetaList)} fetchRecentData={fetchRecentData} />
    <div style={{ margin: 10 }}>
      <div>Select Currency</div>
      <Select options={CURRENCY} style={{ width: 120 }} onSelect={setCurrency} />
      <Button style={{ marginLeft: 10 }} onClick={transform}>transform</Button>
    </div>
  </div>
}