import { useState } from 'react';
import { api } from '../api';
import { Form, Input, Button, Card, message, Upload } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';

export function LoginPage({ onLogin, onSwitchToRegister }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await api.login(values.email, values.password);
      localStorage.setItem('token', data.access_token);
      message.success('登录成功');
      onLogin();
    } catch (err) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card title="登录" style={styles.card}>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={styles.switchLink}>
          没有账号? <Button type="link" onClick={onSwitchToRegister}>立即注册</Button>
        </div>
      </Card>
    </div>
  );
}

export function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  const handleSendCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.warning('请先输入邮箱');
        return;
      }
      setSendingCode(true);
      await api.sendVerificationCode(email);
      message.success('验证码已发送');
      setCountdown(6);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      message.error(err.message || '发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const avatar = values.avatar?.[0]?.originFileObj;
      const data = await api.register(values.email, values.password, values.displayName, values.code, avatar);
      localStorage.setItem('token', data.access_token);
      message.success('注册成功');
      onRegister();
    } catch (err) {
      message.error(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Card title="注册" style={styles.card}>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}>
            <Input.Search
              placeholder="验证码"
              enterButton={countdown > 0 ? `${countdown}s` : '发送验证码'}
              onSearch={handleSendCode}
              loading={sendingCode}
              disabled={countdown > 0}
              size="large"
            />
          </Form.Item>
          <Form.Item name="displayName" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input prefix={<UserOutlined />} placeholder="显示名称" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item name="confirmPassword" dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
          </Form.Item>
          <Form.Item name="avatar" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />}>上传头像（可选）</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={styles.switchLink}>
          已有账号? <Button type="link" onClick={onSwitchToLogin}>立即登录</Button>
        </div>
      </Card>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  switchLink: {
    textAlign: 'center',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f0f0f0',
  },
};