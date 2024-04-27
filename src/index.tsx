import React, {useEffect, useState} from 'react'
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
    IFilterUserValue,
    IFilterUserCondition,
    IRecord,
    FilterOperator,
    IOpenUser,
    FilterConjunction, ITable, FieldType
} from '@lark-base-open/js-sdk';
import {MetaItem} from './types';
import {Alert, AlertProps, Button, Select} from 'antd';
import {CURRENCY} from './const';
import {getExchangeRate} from './exchange-api';
import List from './list'; // 引入 List.tsx 文件
import SearchUser, {getCurrentUserInfo} from './searchUser';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <LoadApp/>
    </React.StrictMode>
)

function LoadApp() {
    const [titleField, setTitleField] = useState<IField>();
    const [descirbeField, setDescribeField] = useState<IField>();
    const [lastTimeField, setLastTimeField] = useState<IField>();
    const [taskerField, setTaskerField] = useState<IField>();
    const [acceptorField, setAcceptorField] = useState<IField>();
    const [currencyFieldMetaList, setMetaList] = useState<ICurrencyFieldMeta[]>([])
    const [selectFieldId, setSelectFieldId] = useState<string>();
    const [currency, setCurrency] = useState<CurrencyCode>();
    const [titleFieldMetaList, setTitleList] = useState<(IRecord | undefined)[]>([])

    useEffect(() => {
        const fn = async () => {
            console.log('LoadApp component is mounted'); // 组件挂载时打印日志

            const table = await bitable.base.getTableByName("任务管理") as ITable;
            const tableName = await table.getName();
            const lastTimeField = await table.getFieldByName("实际完成日期")
            const describeField = await table.getFieldByName("任务描述")
            const titleField = await table.getFieldByName("标题")
            const acceptorField = await table.getFieldByName("验收人员")
            const finashAcceptorField = await table.getFieldByName("已验收人员")
            const taskerField = await table.getFieldByName("任务执行人")
            setLastTimeField(lastTimeField);
            setDescribeField(describeField);
            setTitleField(titleField);
            setAcceptorField(acceptorField);
            setTaskerField(taskerField);
            const status: ISingleSelectField = await table.getFieldByName("进展")
            const statusOptions = await status.getOptions();
            const statusOption = statusOptions.filter(item => item.name === "已完成")

            // const t = await bitable.base.getActiveTable();
            const v = await table.getActiveView(); // 表格视图

            const currentUserInfoPromise = getCurrentUserInfo();
            const currentUserInfo = await currentUserInfoPromise as IOpenUser;
            // 初始化条件数组，包含基本条件
            const conditions = [
                {
                    fieldId: status.id,
                    operator: FilterOperator.Is,
                    value: statusOption[0].id
                }
            ];

            console.log( conditions)
            // 过滤出多行文本包含 123 的记录 id
            const recordIdList = await v.getVisibleRecordIdList({
                conjunction: FilterConjunction.And,
                conditions: conditions,
            }, [{
                fieldId: lastTimeField.id,
                desc: true
            }]);
            console.info("recordIdList:"+recordIdList)
            const {records} = await table.getRecords({
                pageSize: 5000
            })

            console.info(records)
            const myRecords = recordIdList.map(recordId => records.find(item => (item.recordId === recordId)));
            const filteredRecords = await Promise.all(myRecords.map(async (record: IRecord | undefined, index: number) => {
                if (record) {
                    // 在这里进行类型断言，确保 record 是 IRecord 类型
                    const { recordId, fields } = record;

                    // 异步函数，检查记录中是否有任务
                    const hasTask = async (record: IRecord): Promise<boolean> => {
                        const finashAs = (record.fields[finashAcceptorField.id] || []) as IOpenUser[];
                        const accepts = (record.fields[acceptorField.id] || []) as IOpenUser[];

                        const currentUserInFinashAs = accepts.some(user => user.id === currentUserInfo.id);

                        if (currentUserInFinashAs) {
                            return !finashAs.some(user => user.id === currentUserInfo.id);
                        } else {
                            return false;
                        }
                    };

                    // 使用 await 等待 hasTask 函数的返回值
                    const hasTaskResult = await hasTask(record);

                    console.log(recordIdList.includes(recordId) && hasTaskResult);
                    return recordIdList.includes(recordId) && hasTaskResult ? record : null;
                }

                return null;
            }));
            const filteredRecordsWithoutNull = filteredRecords.filter(record => record !== null) as IRecord[];
            console.info(filteredRecordsWithoutNull)
            setTitleList(filteredRecordsWithoutNull);


        };
        fn();
    }, []);
    const formatFieldMetaList = (metaList: ICurrencyFieldMeta[]) => {
        return metaList.map(meta => {
            return {label: meta.name, value: meta.id};
        });
    };


    const formatTitleFieldMetaList = (metaList: IRecord[]): MetaItem[] => {
        return metaList.map(meta => {
            const title: IOpenCellValue = (meta.fields[titleField.id][0] as IOpenCellValue);
            const descirbe: IOpenCellValue = (meta.fields[descirbeField.id][0] as IOpenCellValue);
            const acceptor: IOpenUser[] = (meta.fields[acceptorField.id][0] as IOpenUser[]);
            const lastTime = meta.fields[lastTimeField.id]
            const tasker = meta.fields[taskerField.id] as IOpenUser[]
            // console.log(lastTimeField)
            // console.log(meta)
            return {
                [meta.recordId]: {
                    title: title.text,
                    description: descirbe.text,
                    acceptor: acceptor,
                    lastTime: lastTime === null ? "" : new Date(lastTime).toLocaleString(),
                    tasker: tasker[0].name,
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
        <div style={{margin: 10}}>
            <SearchUser/>
            {/*<Select style={{width: 120}} onSelect={setTitleList}*/}
            {/*        options={formatTitleFieldMetaList(titleFieldMetaList)}/>*/}
        </div>
        <List />
        {/*<div style={{margin: 10}}>*/}
        {/*    <div>Select Currency</div>*/}
        {/*    <Select options={CURRENCY} style={{width: 120}} onSelect={setCurrency}/>*/}
        {/*    <Button style={{marginLeft: 10}} onClick={transform}>transform</Button>*/}
        {/*</div>*/}
    </div>
}