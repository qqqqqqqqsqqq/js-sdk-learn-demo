import React, { useState } from 'react';
import { bitable, CurrencyCode, FieldType, ISingleSelectField, ICurrencyField, ICurrencyFieldMeta, IOpenCellValue, IOpenSingleSelect, FilterOperator } from '@lark-base-open/js-sdk';
import { MetaItem } from './types';
interface IListItem {
    id: number;
    name: string;
    lastModified: string;
}

interface ListProps {
    listData: MetaItem[];
    fetchRecentData: (selectedItems: string[]) => void;
}

const RecentList: React.FC<ListProps> = ({ listData, fetchRecentData }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);

    const handleCheckboxChange = (itemId: string) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const handleSubmit = () => {
        // 关闭模态窗口
        setShowModal(false);

        // 调用 index.tsx 中的方法，并传递选中的项
        fetchRecentData(selectedItems);
    };

    const showModalHandler = () => {
        setShowModal(true);
    };

    return (
        <div>
            <button onClick={showModalHandler}>展示最近操作过的列表数据</button>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">

            <span className="close" onClick={() => setShowModal(false)}>
              &times;
            </span>
                        <h2>最近操作过的列表数据</h2>
                        <ul>
                            {listData.map(item => (
                                <li key={Object.keys(item)[0]}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(Object.keys(item)[0])}
                                        onChange={() => handleCheckboxChange(Object.keys(item)[0])}
                                    />

                                    {Object.values(item)[0].title} - 最后修改时间：{Object.values(item)[0].lastTime}
                                </li>
                            ))}
                        </ul>
                        <button onClick={handleSubmit}>提交</button>
                    </div>
                </div>
            )}

            <style>
                {`
          .modal {
            display: block;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.4);
          }
          .modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 60%;
          }
          .close {
            color: #aaaaaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
          }
          .close:hover,
          .close:focus {
            color: #000;
            text-decoration: none;
            cursor: pointer;
          }
        `}
            </style>
        </div>
    );
};

export default RecentList;
