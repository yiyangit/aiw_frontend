'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Grid, Form, Button, Card, Header, Segment, Message, Icon, Divider } from 'semantic-ui-react';
import { authService, LoginInput, RegisterInput } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { login, guestLogin } = useAuth();

  // 登录表单状态
  const [loginForm, setLoginForm] = useState<LoginInput>({
    username: '',
    password: '',
  });

  // 注册表单状态
  const [registerForm, setRegisterForm] = useState<{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await login(loginForm.username, loginForm.password);

      if (result.success) {
        setSuccess('登录成功！正在跳转...');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // 验证密码确认
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = registerForm;
      const response = await authService.register(registerData);

      if (response.status === 'success') {
        setSuccess('注册成功！请登录...');
        setTimeout(() => {
          setIsLogin(true);
          setError('');
          setSuccess('');
        }, 1500);
      } else {
        setError(response.message || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // 游客模式：直接跳转主页，不执行登录
    setSuccess('以游客身份继续...');
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <Container style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '2rem', justifyContent: 'center' }}>
      <Grid centered>
        <Grid.Column width={10} tablet={12} mobile={16} style={{ maxWidth: '450px', margin: '0 auto' }}>
          <Card fluid style={{
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <Header as="h1" style={{ color: 'white', margin: 0 }}>
                <Icon name="graduation cap" />
                Aihara Workbooks
              </Header>
              <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: '1rem' }}>
                智能题库学习系统
              </p>
            </div>

            <Card.Content style={{ padding: '3rem 2rem' }}>
              {error && (
                <Message negative style={{ marginBottom: '2rem' }}>
                  <Message.Header>错误</Message.Header>
                  <p>{error}</p>
                </Message>
              )}

              {success && (
                <Message positive style={{ marginBottom: '2rem' }}>
                  <Message.Header>成功</Message.Header>
                  <p>{success}</p>
                </Message>
              )}

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Button.Group>
                  <Button
                    primary={isLogin}
                    onClick={() => {
                      setIsLogin(true);
                      setError('');
                      setSuccess('');
                    }}
                    style={{ borderRadius: '50px 0 0 50px' }}
                  >
                    登录
                  </Button>
                  <Button
                    primary={!isLogin}
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                      setSuccess('');
                    }}
                    style={{ borderRadius: '0 50px 50px 0' }}
                  >
                    注册
                  </Button>
                </Button.Group>
              </div>

              {isLogin ? (
                <Form onSubmit={handleLogin} loading={loading}>
                  <Form.Field>
                    <label>用户名</label>
                    <Form.Input
                      fluid
                      icon="user"
                      iconPosition="left"
                      placeholder="请输入用户名"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </Form.Field>

                  <Form.Field>
                    <label>密码</label>
                    <Form.Input
                      fluid
                      icon="lock"
                      iconPosition="left"
                      type="password"
                      placeholder="请输入密码"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </Form.Field>

                  <Button
                    primary
                    fluid
                    size="large"
                    type="submit"
                    loading={loading}
                    style={{
                      borderRadius: '50px',
                      padding: '1rem',
                      fontSize: '1.1rem',
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <Icon name="sign in" /> 登录
                  </Button>
                </Form>
              ) : (
                <Form onSubmit={handleRegister} loading={loading}>
                  <Form.Field>
                    <label>用户名</label>
                    <Form.Input
                      fluid
                      icon="user"
                      iconPosition="left"
                      placeholder="请输入用户名（3-20个字符）"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                      minLength={3}
                      maxLength={20}
                    />
                  </Form.Field>

                  <Form.Field>
                    <label>邮箱</label>
                    <Form.Input
                      fluid
                      icon="mail"
                      iconPosition="left"
                      type="email"
                      placeholder="请输入邮箱地址"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </Form.Field>

                  <Form.Field>
                    <label>密码</label>
                    <Form.Input
                      fluid
                      icon="lock"
                      iconPosition="left"
                      type="password"
                      placeholder="请输入密码（至少6个字符）"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </Form.Field>

                  <Form.Field>
                    <label>确认密码</label>
                    <Form.Input
                      fluid
                      icon="lock"
                      iconPosition="left"
                      type="password"
                      placeholder="请再次输入密码"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                    />
                  </Form.Field>

                  <Button
                    primary
                    fluid
                    size="large"
                    type="submit"
                    loading={loading}
                    style={{
                      borderRadius: '50px',
                      padding: '1rem',
                      fontSize: '1.1rem',
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <Icon name="user plus" /> 注册
                  </Button>
                </Form>
              )}

              <Divider horizontal style={{ margin: '2rem 0' }}>
                <Header as="h4">
                  <Icon name="ellipsis horizontal" />
                </Header>
              </Divider>

              <div style={{ textAlign: 'center' }}>
                <Button
                  secondary
                  basic
                  fluid
                  size="large"
                  onClick={handleGuestLogin}
                  loading={loading}
                  style={{
                    borderRadius: '50px',
                    padding: '0.8rem'
                  }}
                >
                游客登录
                </Button>
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>
      </Grid>
    </Container>
  );
}