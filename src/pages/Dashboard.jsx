import { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, Row, Col, Button, Modal, Form, Input, Select, DatePicker, Table, Tag, message, Popconfirm, Space, Avatar, List, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, UserAddOutlined, DollarOutlined, SwapOutlined, LogoutOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export function Dashboard({ onLogout }) {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLedgerName, setNewLedgerName] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);

  useEffect(() => {
    loadLedgers();
  }, []);

  const loadLedgers = async () => {
    try {
      const data = await api.getLedgers();
      setLedgers(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLedger = async (values) => {
    try {
      await api.createLedger(values.name, values.currency || 'CNY');
      message.success('创建成功');
      setCreateModalOpen(false);
      loadLedgers();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDeleteLedger = async (id) => {
    try {
      await api.deleteLedger(id);
      message.success('删除成功');
      loadLedgers();
      if (selectedLedger?.id === id) setSelectedLedger(null);
    } catch (err) {
      message.error(err.message);
    }
  };

  if (selectedLedger) {
    return <LedgerDetail ledger={selectedLedger} onBack={() => setSelectedLedger(null)} onRefresh={loadLedgers} />;
  }

  return (
    <div style={styles.container}>
      <Card title="我的账本" extra={
        <Space>
          <Button icon={<LogoutOutlined />} onClick={onLogout}>退出</Button>
        </Space>
      } style={styles.mainCard}>
        <Form layout="inline" style={styles.createForm}>
          <Form.Item>
            <Input placeholder="账本名称" value={newLedgerName} onChange={(e) => setNewLedgerName(e.target.value)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>创建账本</Button>
          </Form.Item>
        </Form>

        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : ledgers.length === 0 ? (
          <EmptyState onCreate={() => setCreateModalOpen(true)} />
        ) : (
          <Row gutter={[16, 16]}>
            {ledgers.map((ledger) => (
              <Col xs={24} sm={12} md={8} lg={6} key={ledger.id}>
                <Card hoverable style={styles.ledgerCard} onClick={() => api.getLedger(ledger.id).then(setSelectedLedger)}>
                  <Card.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{ledger.name[0]}</Avatar>}
                    title={ledger.name}
                    description={<Tag color="blue">{ledger.currency}</Tag>}
                  />
                  <div style={styles.cardActions}>
                    <Button type="link" size="small">查看详情</Button>
                    <Popconfirm title="确定删除这个账本吗？" onConfirm={(e) => { e?.stopPropagation(); handleDeleteLedger(ledger.id); }}>
                      <Button type="link" danger size="small" onClick={(e) => e.stopPropagation()}>删除</Button>
                    </Popconfirm>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal title="创建账本" open={createModalOpen} onCancel={() => setCreateModalOpen(false)} footer={null}>
        <Form onFinish={handleCreateLedger} layout="vertical">
          <Form.Item name="name" label="账本名称" rules={[{ required: true, message: '请输入账本名称' }]}>
            <Input placeholder="如：旅行AA" />
          </Form.Item>
          <Form.Item name="currency" label="货币" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">人民币 (CNY)</Select.Option>
              <Select.Option value="USD">美元 (USD)</Select.Option>
              <Select.Option value="JPY">日元 (JPY)</Select.Option>
              <Select.Option value="EUR">欧元 (EUR)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>📋</div>
      <h3>暂无账本</h3>
      <p>创建一个账本开始你的AA记账之旅</p>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>创建账本</Button>
    </div>
  );
}

function LedgerDetail({ ledger, onBack, onRefresh }) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('expenses');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [createSettlementOpen, setCreateSettlementOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [ledger.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, expensesData, settlementsData] = await Promise.all([
        api.getMembers(ledger.id),
        api.getExpenses(ledger.id),
        api.getSettlements(ledger.id),
      ]);
      setMembers(membersData);
      setExpenses(expensesData);
      setSettlements(settlementsData);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExpense = async (expenseId, status) => {
    try {
      await api.confirmExpense(expenseId, status);
      message.success(status === 'confirmed' ? '已确认' : '已拒绝');
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const expenseColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', render: (t) => t || '未命名支出' },
    { title: '金额', dataIndex: 'total_amount', key: 'amount', render: (v) => <span style={{ color: '#52c41a', fontWeight: bold }}>¥{v}</span> },
    { title: '付款人', key: 'payer', render: (_, r) => r.payer?.display_name || r.payer?.email },
    { title: '日期', dataIndex: 'expense_date', key: 'date' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s) => {
        const map = { pending: 'orange', confirmed: 'green', rejected: 'red' };
        const text = { pending: '待确认', confirmed: '已确认', rejected: '已拒绝' };
        return <Tag color={map[s]}>{text[s]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, r) => r.status === 'pending' ? (
        <Space>
          <Button type="link" size="small" onClick={() => handleConfirmExpense(r.id, 'confirmed')}>确认</Button>
          <Button type="link" danger size="small" onClick={() => handleConfirmExpense(r.id, 'rejected')}>拒绝</Button>
        </Space>
      ) : '-',
    },
  ];

  const memberColumns = [
    { 
      title: '成员', 
      key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>{r.user?.display_name?.[0] || r.user?.email?.[0]?.toUpperCase() || '?'}</Avatar>
          <span>{r.nickname || r.user?.display_name || r.user?.email}</span>
        </Space>
      )
    },
    { title: '邮箱', dataIndex: ['user', 'email'], key: 'email' },
  ];

  const settlementColumns = [
    { 
      title: '从', 
      key: 'from',
      render: (_, r) => r.from_user?.display_name || r.from_user?.email
    },
    { 
      title: '到', 
      key: 'to',
      render: (_, r) => r.to_user?.display_name || r.to_user?.email
    },
    { 
      title: '金额', 
      dataIndex: 'amount', 
      key: 'amount',
      render: (v) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{v}</span>
    },
    { title: '日期', dataIndex: 'settled_at', key: 'date', render: (v) => dayjs(v).format('YYYY-MM-DD') },
  ];

  return (
    <div style={styles.container}>
      <Card 
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} />
            <span>{ledger.name}</span>
          </Space>
        }
        extra={<Button onClick={onBack}>返回</Button>}
        style={styles.mainCard}
      >
        <Card type="inner" extra={
          <Space wrap>
            <Button icon={<UserAddOutlined />} onClick={() => setAddMemberOpen(true)}>添加成员</Button>
            <Button type="primary" icon={<DollarOutlined />} onClick={() => setCreateExpenseOpen(true)}>添加支出</Button>
            <Button icon={<SwapOutlined />} onClick={() => setCreateSettlementOpen(true)}>添加结算</Button>
          </Space>
        }>
          成员 {members.length} | 支出 {expenses.length} | 结算 {settlements.length}
        </Card>

        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: '16px' }}>
          <Tabs.TabPane tab={`支出 (${expenses.length})`} key="expenses">
            <Table columns={expenseColumns} dataSource={expenses} rowKey="id" loading={loading} pagination={false} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={`成员 (${members.length})`} key="members">
            <Table columns={memberColumns} dataSource={members} rowKey="user_id" loading={loading} pagination={false} />
          </Tabs.TabPane>
          <Tabs.TabPane tab={`结算 (${settlements.length})`} key="settlements">
            <Table columns={settlementColumns} dataSource={settlements} rowKey="id" loading={loading} pagination={false} />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <AddMemberModal
        open={addMemberOpen}
        onCancel={() => setAddMemberOpen(false)}
        ledgerId={ledger.id}
        existingIds={members.map(m => m.user_id)}
        onSuccess={() => { setAddMemberOpen(false); loadData(); }}
      />

      <CreateExpenseModal
        open={createExpenseOpen}
        onCancel={() => setCreateExpenseOpen(false)}
        ledgerId={ledger.id}
        members={members}
        onSuccess={() => { setCreateExpenseOpen(false); loadData(); }}
      />

      <CreateSettlementModal
        open={createSettlementOpen}
        onCancel={() => setCreateSettlementOpen(false)}
        ledgerId={ledger.id}
        members={members}
        onSuccess={() => { setCreateSettlementOpen(false); loadData(); }}
      />
    </div>
  );
}

import Tabs from 'antd/es/tabs';

function AddMemberModal({ open, onCancel, ledgerId, existingIds, onSuccess }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const users = await api.searchUsers(search);
      setResults(users.filter(u => !existingIds.includes(u.id)));
    } catch (err) {
      message.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId) => {
    setAddingId(userId);
    try {
      await api.addMember(ledgerId, userId, '');
      message.success('添加成功');
      onSuccess();
    } catch (err) {
      message.error(err.message);
      setAddingId(null);
    }
  };

  return (
    <Modal title="添加成员" open={open} onCancel={onCancel} footer={null} width={500}>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input placeholder="搜索邮箱或用户名" value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={handleSearch} />
        <Button type="primary" loading={searching} onClick={handleSearch}>搜索</Button>
      </Space.Compact>
      <List
        dataSource={results}
        renderItem={(user) => (
          <List.Item actions={[
            <Button key="add" type="primary" size="small" loading={addingId === user.id} onClick={() => handleAdd(user.id)}>添加</Button>
          ]}>
            <List.Item.Meta avatar={<Avatar>{user.display_name?.[0] || user.email[0].toUpperCase()}</Avatar>} title={user.display_name || user.email} description={user.email} />
          </List.Item>
        )}
        locale={{ emptyText: '搜索用户' }}
      />
    </Modal>
  );
}

function CreateExpenseModal({ open, onCancel, ledgerId, members, onSuccess }) {
  const [form] = Form.useForm();
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  const amount = Form.useWatch('amount', form);
  const membersList = members || [];

  useEffect(() => {
    if (amount && membersList.length > 0 && splitType === 'equal') {
      const equal = (parseFloat(amount) / membersList.length).toFixed(2);
      setSplits(membersList.map(m => ({ userId: m.user_id, amount: parseFloat(equal) })));
    }
  }, [amount, membersList.length, splitType]);

  const handleAmountChange = (value) => {
    if (splitType === 'equal' && value && membersList.length > 0) {
      const equal = (parseFloat(value) / membersList.length).toFixed(2);
      setSplits(membersList.map(m => ({ userId: m.user_id, amount: parseFloat(equal) })));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await api.createExpense(ledgerId, {
        title: values.title,
        total_amount: parseFloat(values.amount),
        payer_id: values.payer_id,
        expense_date: values.date.format('YYYY-MM-DD'),
        description: values.description,
        splits: splitType === 'equal' 
          ? splits.map(s => ({ user_id: s.userId, amount: s.amount }))
          : values.splits,
      });
      message.success('添加成功');
      onSuccess();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="添加支出" open={open} onCancel={onCancel} onOk={handleSubmit} confirmLoading={loading} width={600}>
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input placeholder="如：午餐" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" onChange={handleAmountChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date" label="日期" rules={[{ required: true }]} initialValue={dayjs()}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="payer_id" label="付款人" rules={[{ required: true }]}>
          <Select placeholder="选择付款人">
            {membersList.map(m => <Select.Option key={m.user_id} value={m.user_id}>{m.nickname || m.user?.display_name || m.user?.email}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="description" label="说明">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item label="分摊方式">
          <Select value={splitType} onChange={setSplitType} style={{ width: 200 }}>
            <Select.Option value="equal">平均分摊</Select.Option>
            <Select.Option value="percentage">按比例</Select.Option>
            <Select.Option value="exact">按金额</Select.Option>
          </Select>
        </Form.Item>
        {splitType !== 'equal' && (
          <Form.Item label="分摊明细">
            {membersList.map((m, idx) => (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 120 }}>{m.nickname || m.user?.display_name || m.user?.email}</span>
                <Form.Item noStyle name={['splits', idx, 'amount']} initialValue={0}>
                  <InputNumber min={0} step={0.01} prefix="¥" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item noStyle name={['splits', idx, 'user_id']} hidden initialValue={m.user_id} />
              </div>
            ))}
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

function CreateSettlementModal({ open, onCancel, ledgerId, members, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await api.createSettlement(ledgerId, values.from_user_id, values.to_user_id, parseFloat(values.amount), values.note);
      message.success('结算成功');
      onSuccess();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="添加结算" open={open} onCancel={onCancel} onOk={handleSubmit} confirmLoading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item name="from_user_id" label="付款人" rules={[{ required: true }]}>
          <Select placeholder="选择付款人">
            {members.map(m => <Select.Option key={m.user_id} value={m.user_id}>{m.nickname || m.user?.display_name || m.user?.email}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="to_user_id" label="收款人" rules={[{ required: true }]}>
          <Select placeholder="选择收款人">
            {members.map(m => <Select.Option key={m.user_id} value={m.user_id}>{m.nickname || m.user?.display_name || m.user?.email}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" />
        </Form.Item>
        <Form.Item name="note" label="说明">
          <Input placeholder="如：还饭钱" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '24px',
  },
  mainCard: {
    maxWidth: 1200,
    margin: '0 auto',
    borderRadius: '8px',
  },
  createForm: {
    marginBottom: '24px',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#999',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  ledgerCard: {
    cursor: 'pointer',
    borderRadius: '8px',
  },
  cardActions: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
  },
};