import React, { useState } from 'react';
import { bitable, ITable, IRecord, IOpenUser, FilterOperator } from '@lark-base-open/js-sdk';
const SearchUser = () => {
    const [showList, setShowList] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [inputText, setInputText] = useState('');
    const [isButtonVisible, setIsButtonVisible] = useState(true);
    const [userList, setUserList] = useState<IOpenUser[]>();
    const toggleList = () => {
        setShowList(!showList);
    };

    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const handleSelectUser = (event) => {
        setSelectedUser(event.target.value);
    };

    const handleSubmit = () => {
        bindUser();
        setShowList(false);
    };

    const bindUser = () => {

    };

    const fn = async () => {

        const currentUserId = await bitable.bridge.getUserId();
        const tableModule = await bitable.base.getTableByName("人员信息绑定表（程序生成勿动）") as ITable;
        const userIdField = await tableModule.getFieldByName("人员id");
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
        console.info(recordIdList)

        const resultFlag = recordIdList.length === 0
        setIsButtonVisible(resultFlag);
        if (isButtonVisible) {
            console.info(isButtonVisible)
            const table = await bitable.base.getTableByName("任务管理") as ITable;
            console.info(table)
            const lastTimeField = await table.getFieldByName("实际完成日期")
            const views = await table.getViewList();
            const v = views[0];

            const userIdField = await table.getFieldByName("验收人员");
            const recordIdList = await v.getVisibleRecordIdList(undefined,
[{
    fieldId: lastTimeField.id,
    desc: true,
}]);

            console.info("recordList:" + recordIdList)

            console.info(recordIdList);
            const { records } = await table.getRecords({
                pageSize: 5000
            })
            const myRecords = recordIdList.map(recordId => records.find(item => (item.recordId === recordId)));
            // const filteredRecords = myRecords.filter(({ recordId, fields }) => {
            //   return recordIdList.includes(recordId)
            // })
            // console.info(filteredRecords)
            // const openUsers = filteredRecords.map(meta => {
            //   console.log(meta);
            //   return (meta.fields[userIdField.id][0] as IOpenUser[]);
            // });
            // console.log(openUsers)
        };
        fn();

    }

    // const filteredUsers = userList.filter((user) =>
    //   user.name.includes(inputText)
    // );

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
                    {/* <datalist id="users">
            {userList.map((user) => (
              <option key={user.id} value={user.name} />
            ))}
          </datalist>
          <button onClick={handleSubmit}>确定</button> */}
                </div>
            )}
        </div>
    );
};
export default SearchUser;
