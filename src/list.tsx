import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    bitable,
    FilterConjunction,
    FilterOperator,
    IOpenUser,
    IRecord, IRecordValue,
    ISingleSelectField, ITable
} from '@lark-base-open/js-sdk';
import {getCurrentUserInfo} from './searchUser';
import {MetaItem} from "./types";
import './list.css';

const useTableData = () => {
    const [tableData, setTableData] = useState(null);
    const [error, setError] = useState(null);
    const fetchData = async () => {
        try {
            const table = await bitable.base.getTableByName("任务管理");
            const views = await table.getViewList();
            const statusField: ISingleSelectField = await table.getFieldByName("进展");
            const statusOptions = await statusField.getOptions();
            const statusOption = statusOptions.find(option => option.name === "已完成");
            const statusFinishOption = statusOptions.find(option => option.name === "已验收");
            const fields = await Promise.all([
                table.getFieldByName("标题"),
                table.getFieldByName("任务描述"),
                table.getFieldByName("实际完成日期"),
                table.getFieldByName("验收人员"),
                table.getFieldByName("已验收人员"),
                table.getFieldByName("任务执行人"),
                table.getFieldByName("任务id"),
            ]);

            setTableData({
                table,
                view: views[0],
                statusField,
                statusOption,
                statusFinishOption,
                titleField: fields[0],
                describeField: fields[1],
                lastTimeField: fields[2],
                acceptorField: fields[3],
                finashAcceptorField: fields[4],
                taskerField: fields[5],
                taskIdField: fields[6]
            });
        } catch (err) {
            setError(err);
            console.error("Failed to load table data", err);
        }
    }
    useEffect(() => {
        fetchData();
    }, []);
    return {tableData, error, fetchData};
};

const RecentList = () => {
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [listData, setListData] = useState<MetaItem[]>([]);
    const [selectedListData, setSelectedListData] = useState<MetaItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const {tableData, error, fetchData} = useTableData();
    const [acceptanceScores, setAcceptanceScores] = useState(Array(selectedItems.length).fill(''));
    const [acceptanceComments, setAcceptanceComments] = useState(Array(selectedItems.length).fill(''));

    // 定义一个函数，接受要移除的元素的索引
    const removeItem = (indexToRemove) => {
        // 使用 spread 操作符复制数组
        const newListData = [...selectedListData];
        // 使用 splice() 方法移除指定索引处的元素
        newListData.splice(indexToRemove, 1);
        // 更新状态
        setSelectedListData(newListData);
    }

    const handleCheckboxChange = useCallback((itemId) => {
        setSelectedItems(prevItems => {
            const newItems = new Set(prevItems);
            if (newItems.has(itemId)) {
                newItems.delete(itemId);
            } else {
                newItems.add(itemId);
            }
            return newItems;
        });
    }, []);

    const handleButtonClick = async () => {
        setShowModal(true);
        await fetchData();
        console.log('Modal is now visible'); // Example additional action

    };
    const handleSelectTasks = () => {
        setShowModal(false);
        //展示表单信息
        setSelectedListData(listData.filter(data => selectedItems.has(data.id)))
        // setShowTable(false);
    };

    const handleTabClick = (index) => {
        setActiveTabIndex(index);
    };
    const handleScoreChange = (index, value) => {
        const newScores = [...acceptanceScores];
        newScores[index] = value;
        setAcceptanceScores(newScores);
        const score = parseInt(value);

        // 检查评分是否在 1 到 5 的范围内
        if (score < 1 || isNaN(score)) {
            // 如果评分小于 1 或者输入的不是数字，则将评分设置为最小值 1
            setAcceptanceScores(prevScores => {
                const newScores = [...prevScores];
                newScores[index] = 1; // 设置为最小值 1
                return newScores;
            });
        } else if (score > 5) {
            // 如果评分大于 5，则将评分设置为最大值 5
            setAcceptanceScores(prevScores => {
                const newScores = [...prevScores];
                newScores[index] = 5; // 设置为最大值 5
                return newScores;
            });
        } else {
            // 如果评分在 1 到 5 的范围内，则直接更新评分
            setAcceptanceScores(prevScores => {
                const newScores = [...prevScores];
                newScores[index] = score;
                return newScores;
            });
        }
    };

    //将验收结果添加到验收记录表
    const submitTable = (index: number,
                         acceptanceScore: number,
                         acceptanceComment: string) => {
        const fn2 = async () => {
            const userInfo = await getCurrentUserInfo()
            const user = userInfo as IOpenUser;
            const currentUserId = await bitable.bridge.getUserId();
            const tableModule = await bitable.base.getTableByName("验收记录") as ITable;
            const userIdField = await tableModule.getFieldByName("验收人员");
            const titleField = await tableModule.getFieldByName("标题");
            const describeField = await tableModule.getFieldByName("任务描述");
            const taskerField = await tableModule.getFieldByName("任务执行人");
            const taskIdField = await tableModule.getFieldByName("任务Id");
            const scoreField = await tableModule.getFieldByName("评分");
            const contentField = await tableModule.getFieldByName("评语");
            const users: IOpenUser[] = [user];

    const modalContent = useMemo(() => listData.map(item => (
        <li key={item.id}>
            <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => handleCheckboxChange(item.id)}
            />
            {item.title} - {item.description} - 任务执行人：{item.tasker[0].name} {item.lastTime}
        </li>
    )), [listData, selectedItems, handleCheckboxChange]);

    const tabTableContent = useMemo(() => selectedListData.map((item, index) => (
        <div>
            <div className="tab-menu">

                <div
                    key={index}
                    className={index === activeTabIndex ? "tab-item active" : "tab-item"}
                    onClick={() => handleTabClick(index)}
                >
                    验收任务 {index + 1}
                </div>
            </div>
            <div className="tab-content">
                <div
                    key={index}
                    className={index === activeTabIndex ? "tab-pane active" : "tab-pane"}
                >
                    <form key={index} className={index === activeTabIndex ? "tab-pane active" : "tab-pane"}>
                        <div>
                            <div className="form-group">
                                <label>标题:</label>
                                <input type="text" value={item.title} readOnly className="form-input"/>
                            </div>
                            <div className="form-group">
                                <label>描述:</label>

                                <textarea value={item.description} readOnly className="form-input"/>

                            </div>
                            <div className="form-group">
                                <label>任务执行人:</label>
                                <input type="text" value={item.tasker[0].name} readOnly className="form-input"/>
                            </div>
                            <div className="form-group">
                                <label>完成时间:</label>
                                <input type="text" value={item.lastTime} readOnly className="form-input"/>
                            </div>
                            <div className="form-group">
                                <label>评分:</label>
                                <input
                                    type="number"
                                    value={acceptanceScores[index]}
                                    min={1} // Set the minimum value to 1
                                    max={5} // Set the maximum value to 5
                                    onChange={(e) => handleScoreChange(index, e.target.value)} // Handle score change
                                    className="form-input"
                                    required // Add the required attribute
                                />
                            </div>
                            <div className="form-group">
                                <label>验收评语:</label>
                                <textarea
                                    value={acceptanceComments[index]}
                                    onChange={(e) => handleCommentChange(index, e.target.value)} // Handle comment change
                                    className="form-input"
                                    required // Add the required attribute
                                />
                            </div>
                        </div>
                        <button type="button" onClick={() => handleSubmit(index)}>提交</button>
                    </form>
                </div>

            </div>
        </div>
    )), [listData, handleTabClick]);

    if (error) {
        return <div>Error loading data. Please try again later.</div>;
    }

    return (
        <div>
            <button onClick={handleButtonClick}>展示可验收的列表数据</button>
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                        <h2>选择验收任务</h2>
                        <ul>{modalContent}</ul>
                        <button onClick={() => handleSelectTasks()}>选择任务</button>
                    </div>
                </div>
            )}
            {tabTableContent}
        </div>

    );
};

export default RecentList;
