import React, { useState, useEffect } from 'react';
import {bitable, ITable, IRecord, IOpenUser, FilterOperator, IRecordValue} from '@lark-base-open/js-sdk';

export const getCurrentUserInfo = async () => {
    const currentUserId = await bitable.bridge.getUserId();
    const tableModule = await bitable.base.getTableByName("人员信息绑定表（程序生成勿动）") as ITable;
    const userIdField = await tableModule.getFieldByName("人员id");
    const userOptionsField = await tableModule.getFieldByName("人员");
    const views = await tableModule.getViewList();
    const v = views[0];
    const recordIdList = await v.getVisibleRecordIdList({
        conjunction: 'and',
        conditions: [
            {
                fieldId: userIdField.id,
                operator: FilterOperator.Is,
                value: currentUserId
            }
        ],
    });
    const {records} = await tableModule.getRecords({
        pageSize: 5000
    })

    //获取所有已在验收表中的人员信息
    return records.map((record) => {
        const users = record.fields[userOptionsField.id] as IOpenUser[]
        if (users !== null && users.length !== 0) {
            return users[0];
        }
    })[0];
}

const SearchUser = () => {
    const [showList, setShowList] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IOpenUser>();
    const [inputText, setInputText] = useState('');
    const [isButtonVisible, setIsButtonVisible] = useState(true);
    const [userList, setUserList] = useState<Map<string, IOpenUser>>(new Map());
    const toggleList = () => {
        setShowList(!showList);
    };
        useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (event) => {
        setInputText(event.target.value);
        // Attempt to set the selected user based on input text directly (works if user clicks or types full name)
        const userArray = Array.from(userList.values());
        const matchedUser = userArray.find(user => user.name === event.target.value);
        if (matchedUser) {
            setSelectedUser(matchedUser);
        }
    };

    const handleSubmit = () => {
        if (selectedUser) {
            bindUser(selectedUser);
            setShowList(false);
        } else {
            // Fallback if user types the name but does not select from the list
            const userArray = Array.from(userList.values());
            const matchedUser = userArray.find(user => user.name === inputText);
            if (matchedUser) {
                setSelectedUser(matchedUser);
                bindUser(matchedUser);
                setShowList(false);
            } else {
                alert('Please select a valid user from the list.');
            }
        }
    };



    //新增记录到人员表
    const bindUser = (user: IOpenUser) => {


        const fn2 = async () => {
            const currentUserId = await bitable.bridge.getUserId();
            const tableModule = await bitable.base.getTableByName("人员信息绑定表（程序生成勿动）") as ITable;
            const userIdField = await tableModule.getFieldByName("人员id");
            const userOptionsField = await tableModule.getFieldByName("人员");
            const users: IOpenUser[] = [user];
            const record: IRecordValue = {
                fields: {
                    [userIdField.id]: currentUserId,
                    [userOptionsField.id]: users
                }
            }
            console.log(record)
            tableModule.addRecord(record);
        }
        fn2()
    };

    const fetchData = async () => {
        const currentUserId = await bitable.bridge.getUserId();
        console.info(currentUserId);
        const tableModule = await bitable.base.getTableByName("人员信息绑定表（程序生成勿动）") as ITable;
        const userIdField = await tableModule.getFieldByName("人员id");
        const userOptionsField = await tableModule.getFieldByName("人员");
        const views = await tableModule.getViewList();
        const v = views[0];
        const recordIdList = await v.getVisibleRecordIdList({
            conjunction: 'and',
            conditions: [
                {
                    fieldId: userIdField.id,
                    operator: FilterOperator.Is,
                    value: currentUserId
                }
            ],
        });
        const {records} = await tableModule.getRecords({
            pageSize: 5000
        })

        //获取所有已在验收表中的人员信息

        const bindingUserMap: Map<string, IOpenUser> = new Map()
        records.forEach((record) => {
            const users = record.fields[userOptionsField.id] as IOpenUser[]
            if (users !== null && users.length !== 0) {
                users.forEach(user => {
                    bindingUserMap.set(user.id, user); // 将用户添加到 Set 中，确保唯一性
                });
            }
        });


        const resultFlag = recordIdList.length === 0
        setIsButtonVisible(resultFlag);
        if (isButtonVisible) {
            //查询人员列表数据
            const table = await bitable.base.getTableByName("任务管理") as ITable;
            const lastTimeField = await table.getFieldByName("实际完成日期")
            const views = await table.getViewList();
            const v = views[0];

            const userIdField = await table.getFieldByName("验收人员");
            const recordIdList = await v.getVisibleRecordIdList(undefined,
                [{
                    fieldId: lastTimeField.id,
                    desc: true,
                }]);

            const {records} = await table.getRecords({
                pageSize: 5000
            })

            const userMapById: Map<string, IOpenUser> = new Map()
            recordIdList.map(recordId => {
                return records.find(item => item.recordId === recordId);
            }).map((record) => {
                if (record !== undefined) {
                    const users = record.fields[userIdField.id] as IOpenUser[]
                    if (users !== null && users && users.length !== 0) {
                        users.forEach(user => {
                            userMapById.set(user.id, user);
                        });
                    }
                }
            });
            console.info(userMapById);
            //最终可选的人员选项
            for (const userId of bindingUserMap.keys()) {
                userMapById.delete(userId);
            }

            setUserList(userMapById);

        }
    }


    return (
        <div>
            {isButtonVisible && <button onClick={toggleList}>首次绑定个人信息</button>}
            {showList && (
                <div>
                    <input
                        type="text"
                        list="users"
                        placeholder="匹配人员身份"
                        value={inputText}
                        onChange={handleInputChange}
                    />
                    <datalist id="users">
                        {Array.from(userList.values()).map(user => (
                            <option key={user.id} value={user.name}/>
                        ))}
                    </datalist>
                    <button onClick={handleSubmit}>确定</button>
                </div>
            )}
        </div>
    );
};
export default SearchUser;
