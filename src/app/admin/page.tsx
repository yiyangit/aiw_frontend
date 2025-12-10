'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Header,
  Form,
  Button,
  Input,
  Table,
  Icon,
  Segment,
  Progress,
  Message,
  Card,
  TextArea,
  Select,
  Tab,
  Statistic,
} from 'semantic-ui-react';
import { Collection } from '@/types';
import { uploadImage, uploadImageBatch, uploadImagesBatch, getCollections, generateAnswers, getStatistics } from '@/lib/api';
import { authService } from '@/lib/auth';
import CategoryAndCollectionManager from '@/components/CategoryAndCollectionManager';

export default function AdminPage() {
  // 客户端检查状态（防止hydration错误）
  const [isClient, setIsClient] = useState(false);

  // 认证状态
  const [user, setUser] = useState<any>(null);

  // 页面状态
  const [activeTab, setActiveTab] = useState(0);

  // 数据状态
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [stats, setStats] = useState<{ user_count: number; problem_count: number } | null>(null);

  // 独立的loading状态
  const [uploadLoading, setUploadLoading] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [generateModel, setGenerateModel] = useState('');

  // 生成答案相关状态
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [generateMessages, setGenerateMessages] = useState<Array<{
    type: 'info' | 'progress' | 'error' | 'complete';
    content: string;
    timestamp: number;
    successCount?: number;
    failedCount?: number;
    total?: number;
  }>>([]);

  // 表单状态
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [origin, setOrigin] = useState('金光日');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // 上传队列相关状态
  const [uploadQueue, setUploadQueue] = useState<{
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    results?: Array<{
      id: string;
      statement: string;
      solution: string;
      subject: string;
      section: string;
      origin: string;
      difficulty: number;
    }>;
    error?: string;
  }[]>([]);

  // 消息状态
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);

  // 标记客户端以防止hydration错误
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 检查登录状态和权限
  useEffect(() => {
    if (!isClient) return;
    const authenticated = authService.isAuthenticated();
    if (authenticated) {
      const user = authService.getUser();
      setUser(user);
      // 只有当用户存在且 role >= 2 时才加载数据
      if (user && (user.role !== undefined && user.role !== null && user.role >= 2)) {
        loadData();
      }
      // 注意：权限不足的用户不会调用 loadData()
    }
  }, [isClient]);

  const loadData = async () => {
    await Promise.all([
      loadStatistics(),
      loadCollectionsList(),
    ]);
  };

  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      const statsData = await getStatistics();
      setStats(statsData);
    } catch (error) {
      // Handle error appropriately
      console.error("Failed to load statistics", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadCollectionsList = async () => {
    try {
      setCollectionsLoading(true);
      const collectionsData = await getCollections();
      setCollections(collectionsData || []);
    } catch (error) {
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  // 刷新习题集列表的回调函数，用于在添加习题集后更新下拉框
  const handleCollectionCreated = () => {
    loadCollectionsList();
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setUploadQueue([]);
    setMessage('');
    setResult(null);
    setGenerateMessages([]);
    setGenerateStatus('idle');
  };

  // 图片上传相关函数
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages(fileArray);
      setUploadQueue(
        fileArray.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          file,
          status: 'pending' as const,
          progress: 0,
        }))
      );
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedImages.length === 0) {
      setMessage('请选择图片');
      return;
    }

    setMessage('');
    setResult(null);

    // 处理所有待上传的图片
    const pendingItems = uploadQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) {
      setMessage('没有待上传的图片');
      return;
    }

    try {
      // 更新所有图片的状态为上传中
      setUploadQueue(prev =>
        prev.map(item =>
          item.status === 'pending'
            ? { ...item, status: 'uploading', progress: 0 }
            : item
        )
      );

      // 模拟整体进度更新
      const progressInterval = setInterval(() => {
        setUploadQueue(prev =>
          prev.map(item =>
            item.status === 'uploading'
              ? { ...item, progress: Math.min(item.progress + 10, 90) }
              : item
          )
        );
      }, 200);

      // 一次性发送所有图片到大模型
      const response = await uploadImagesBatch({
        images: pendingItems.map(item => item.file),
        origin: origin,
        collections: selectedCollections,
      });

      clearInterval(progressInterval);

      // 更新所有图片为完成状态
      setUploadQueue(prev =>
        prev.map(item =>
          item.status === 'uploading'
            ? {
                ...item,
                status: 'completed',
                progress: 100,
                results: response.results,
                error: response.errors && response.errors.length > 0 ? response.errors.join('; ') : undefined
              }
            : item
        )
      );

      setMessage(`批量上传完成！共识别出 ${response.results.length} 道题目`);

    } catch (err: any) {
      // 更新所有上传中的图片为错误状态
      setUploadQueue(prev =>
        prev.map(item =>
          item.status === 'uploading'
            ? { ...item, status: 'error', error: err.message || '上传失败' }
            : item
        )
      );
      setMessage('批量上传失败：' + (err.message || '未知错误'));
    }
  };

  // 队列管理函数
  const removeFromQueue = (id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
    setSelectedImages(prev => prev.filter((_, index) => {
      const queueItem = uploadQueue.find((_, qIndex) => qIndex === index);
      return queueItem?.id !== id;
    }));
  };

  const retryUpload = async (id: string) => {
    const queueItem = uploadQueue.find(item => item.id === id);
    if (!queueItem) return;

    setUploadQueue(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: 'pending', progress: 0, error: undefined }
          : item
      )
    );

    await handleUpload(new Event('submit') as any);
  };

  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(item => item.status !== 'completed'));
  };

  const clearAll = () => {
    setUploadQueue([]);
    setSelectedImages([]);
  };

  // 生成答案相关函数
  const handleGenerateAnswers = async () => {
    setGenerateLoading(true);
    setGenerateStatus('running');
    setGenerateMessages([]);
    setMessage('');

    try {
      const stream = await generateAnswers(generateModel || undefined);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      const processStream = async () => {
        const messages: Array<{
          type: 'info' | 'progress' | 'error' | 'complete';
          content: string;
          timestamp: number;
          successCount?: number;
          failedCount?: number;
          total?: number;
        }> = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type && data.content) {
                  const message = {
                    type: data.type,
                    content: data.content,
                    timestamp: Date.now(),
                    successCount: data.successCount,
                    failedCount: data.failedCount,
                    total: data.total,
                  };
                  // 同时更新局部数组和状态
                  messages.push(message);
                  setGenerateMessages(prev => [...prev, message]);
                }
              } catch (e) {
                // 忽略解析错误的行
              }
            }
          }
        }

        // 流结束后检查完成状态
        const hasComplete = messages.some(m => m.type === 'complete');
        const hasError = messages.some(m => m.type === 'error');

        // 只有明确收到 complete 消息才认为完成
        if (hasComplete) {
          setGenerateStatus('completed');
          // 获取最后一条完成消息的统计信息
          const completeMessage = messages[messages.length - 1];
          if (completeMessage && (completeMessage.successCount !== undefined || completeMessage.failedCount !== undefined)) {
            setMessage(`答案生成完成！成功: ${completeMessage.successCount || 0}, 失败: ${completeMessage.failedCount || 0}`);
          } else {
            setMessage('答案生成完成！');
          }
        }
        // 如果没有任何有效消息或出现错误，标记为失败
        else if (messages.length === 0 || hasError) {
          setGenerateStatus('idle');
          if (messages.length === 0) {
            setMessage('生成失败：未收到服务器响应，请检查网络连接或后端服务');
          } else {
            setMessage('生成过程中出现错误，请查看详情');
          }
        }
        // 其他情况（不应该发生）
        else {
          setGenerateStatus('idle');
          setMessage('生成中断：请查看上方日志了解详情');
        }
      };

      await processStream();
    } catch (error: any) {
      setGenerateStatus('idle');
      setMessage(error.message || '生成答案失败');
    } finally {
      setGenerateLoading(false);
    }
  };

  const clearGenerateMessages = () => {
    setGenerateMessages([]);
    setGenerateStatus('idle');
  };

  // 如果还没到客户端，返回加载状态
  if (!isClient) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1b1c1d', padding: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #e0e0e0',
          borderTop: '5px solid #21ba45',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#fff' }}>正在加载管理后台...</p>
      </div>
    );
  }

  const panes = [
    {
      menuItem: '统计',
      render: () => (
        <Tab.Pane attached={false}>
          <Segment>
            <Header as="h3">
              <Icon name="chart bar" />
              <Header.Content>
                概览
              </Header.Content>
            </Header>
            {statsLoading ? (
              <p>加载统计数据中...</p>
            ) : (
              <Statistic.Group widths="two">
                <Statistic>
                  <Statistic.Value>
                    {stats?.user_count}
                  </Statistic.Value>
                  <Statistic.Label>用户总数</Statistic.Label>
                </Statistic>
                <Statistic>
                  <Statistic.Value>
                    {stats?.problem_count}
                  </Statistic.Value>
                  <Statistic.Label>题目总数</Statistic.Label>
                </Statistic>
              </Statistic.Group>
            )}
          </Segment>
        </Tab.Pane>
      ),
    },
    {
      menuItem: '题目管理',
      render: () => (
        <Tab.Pane attached={false}>
          {/* 图片上传 */}
          <Segment>
            <Header as="h3">
              <Icon name="upload" />
              <Header.Content>
                上传题目
                <Header.Subheader>上传题目图片并自动识别</Header.Subheader>
              </Header.Content>
            </Header>
            <Form onSubmit={handleUpload}>
              <Form.Group widths="equal">
                <Form.Field>
                  <label>选择图片（支持多选）</label>
                  <Input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    icon="file image"
                    iconPosition="left"
                  />
                </Form.Field>
                <Form.Field>
                  <label>来源（可选）</label>
                  <Input
                    placeholder="例如：金光日"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    icon="user"
                    iconPosition="left"
                  />
                </Form.Field>
              </Form.Group>
              <Form.Group widths="equal">
                <Form.Field>
                  <label>选择习题集（可多选）</label>
                  <Select
                    placeholder="选择要加入的习题集（可选）"
                    options={(collections || []).map((collection) => ({
                      key: collection.id,
                      text: collection.name,
                      value: collection.id,
                    }))}
                    value={selectedCollections}
                    onChange={(e, { value }) => setSelectedCollections(value as string[])}
                    selection
                    multiple
                    loading={collectionsLoading}
                  />
                </Form.Field>
              </Form.Group>
              <Button
                type="submit"
                color="green"
                icon="upload"
                content="开始批量上传"
                loading={uploadLoading}
                disabled={uploadLoading || uploadQueue.length === 0}
                style={{ marginTop: '1em' }}
              />
            </Form>
          </Segment>
          {/* 上传队列 */}
          {uploadQueue.length > 0 && (
            <Segment>
              <Header as="h3">
                <Icon name="list ul" />
                <Header.Content>
                  上传队列 ({uploadQueue.length} 个文件)
                  <Header.Subheader>
                    待上传: {uploadQueue.filter(item => item.status === 'pending').length} |
                    上传中: {uploadQueue.filter(item => item.status === 'uploading').length} |
                    已完成: {uploadQueue.filter(item => item.status === 'completed').length} |
                    失败: {uploadQueue.filter(item => item.status === 'error').length}
                  </Header.Subheader>
                </Header.Content>
                <Button
                  size="tiny"
                  floated="right"
                  onClick={clearCompleted}
                  disabled={uploadQueue.filter(item => item.status === 'completed').length === 0}
                >
                  清除已完成
                </Button>
                <Button
                  size="tiny"
                  floated="right"
                  onClick={clearAll}
                >
                  清空队列
                </Button>
              </Header>
              <Card.Group itemsPerRow={1} stackable>
                {uploadQueue.map((item) => (
                  <Card key={item.id} color={
                    item.status === 'completed' ? 'green' :
                    item.status === 'error' ? 'red' :
                    item.status === 'uploading' ? 'blue' : 'grey'
                  }>
                    <Card.Content>
                      <Card.Header>
                        <Icon name={
                          item.status === 'completed' ? 'check circle' :
                          item.status === 'error' ? 'times circle' :
                          item.status === 'uploading' ? 'spinner' : 'clock'
                        } />
                        {item.file.name}
                        {item.status === 'uploading' && <Icon loading name="spinner" />}
                      </Card.Header>
                      <Card.Meta>
                        {(item.file.size / 1024).toFixed(1)} KB
                      </Card.Meta>
                      <Card.Description>
                        {item.status === 'pending' && '等待上传...'}
                        {item.status === 'uploading' && (
                          <div>
                            <Progress percent={item.progress} size="tiny" color="blue" />
                            正在上传并处理...
                          </div>
                        )}
                        {item.status === 'completed' && (
                          <div>
                            <Icon name="check" color="green" /> 上传成功！
                            <br />
                            共识别出 {item.results?.length || 0} 道题目
                            {item.results && item.results.length > 0 && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.85em' }}>
                                题目ID: {item.results.map(r => r.id.substring(0, 8)).join(', ')}
                              </div>
                            )}
                            {item.error && (
                              <div style={{ marginTop: '0.5rem', color: 'orange', fontSize: '0.85em' }}>
                                部分题目处理失败: {item.error}
                              </div>
                            )}
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div>
                            <Icon name="times" color="red" /> 上传失败
                            <br />
                            <span style={{ color: 'red', fontSize: '0.9em' }}>
                              {item.error}
                            </span>
                          </div>
                        )}
                      </Card.Description>
                    </Card.Content>
                    <Card.Content extra>
                      <div className="ui two buttons">
                        {item.status === 'error' && (
                          <Button basic color="green" onClick={() => retryUpload(item.id)}>
                            重试
                          </Button>
                        )}
                        {(item.status === 'pending' || item.status === 'completed' || item.status === 'error') && (
                          <Button basic color="red" onClick={() => removeFromQueue(item.id)}>
                            移除
                          </Button>
                        )}
                      </div>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Segment>
          )}
          {/* 一键生成答案 */}
          <Segment>
            <Header as="h3">
              <Icon name="magic" />
              <Header.Content>
                一键生成答案
                <Header.Subheader>
                  为所有答案为空的题目自动生成答案（使用glm-4.5模型，开启思考模式）
                </Header.Subheader>
              </Header.Content>
            </Header>
            <Form>
              <Form.Field>
                <label>模型名称（可选）</label>
                <Input
                  placeholder="留空使用默认模型：glm-4.5"
                  value={generateModel}
                  onChange={(e) => setGenerateModel(e.target.value)}
                  icon="robot"
                  iconPosition="left"
                  disabled={generateLoading}
                />
              </Form.Field>
              <Button
                type="button"
                color="blue"
                icon="magic"
                content="开始生成"
                loading={generateLoading}
                disabled={generateLoading || generateStatus === 'running'}
                onClick={handleGenerateAnswers}
                style={{ marginTop: '1em' }}
              />
              {generateStatus !== 'idle' && (
                <Button
                  type="button"
                  basic
                  color="grey"
                  floated="right"
                  onClick={clearGenerateMessages}
                  disabled={generateLoading}
                  style={{ marginTop: '1em' }}
                >
                  清空日志
                </Button>
              )}
            </Form>
            {/* 生成进度日志 */}
            {generateMessages.length > 0 && (
              <div style={{ marginTop: '2em' }}>
                <Header as="h4">
                  <Icon name="list ul" />
                  <Header.Content>
                    生成进度
                    <Header.Subheader>
                      共 {generateMessages.length} 条日志
                    </Header.Subheader>
                  </Header.Content>
                </Header>
                <Segment style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {generateMessages.map((msg, index) => (
                    <Message
                      key={index}
                      icon={
                        msg.type === 'info' ? 'info circle' :
                        msg.type === 'progress' ? 'check circle' :
                        msg.type === 'error' ? 'times circle' : 'flag'
                      }
                      color={
                        msg.type === 'info' ? 'blue' :
                        msg.type === 'progress' ? 'green' :
                        msg.type === 'error' ? 'red' : 'olive'
                      }
                      size="small"
                      style={{ marginBottom: '0.5em' }}
                    >
                      <Message.Content>
                        <Message.Header style={{ fontSize: '0.9em' }}>
                          {msg.type === 'info' ? '信息' :
                           msg.type === 'progress' ? '进度' :
                           msg.type === 'error' ? '错误' : '完成'}
                          {(msg.successCount !== undefined || msg.failedCount !== undefined || msg.total !== undefined) && (
                            <span style={{ marginLeft: '0.5em', fontSize: '0.85em', color: '#666' }}>
                              {msg.successCount !== undefined && `成功: ${msg.successCount}`}
                              {msg.failedCount !== undefined && ` | 失败: ${msg.failedCount}`}
                              {msg.total !== undefined && ` | 总数: ${msg.total}`}
                            </span>
                          )}
                        </Message.Header>
                        <p style={{ fontSize: '0.85em', marginTop: '0.3em' }}>
                          {msg.content}
                        </p>
                      </Message.Content>
                    </Message>
                  ))}
                </Segment>
                {generateStatus === 'running' && (
                  <Progress
                    percent={100}
                    color="blue"
                    active
                    label="正在生成答案..."
                    size="small"
                  />
                )}
                {generateStatus === 'completed' && (
                  <Message positive>
                    <Message.Header>
                      生成完成
                      {(() => {
                        const lastMessage = generateMessages[generateMessages.length - 1];
                        if (lastMessage && (lastMessage.successCount !== undefined || lastMessage.failedCount !== undefined)) {
                          return (
                            <span style={{ marginLeft: '0.5em', fontSize: '0.85em' }}>
                              {lastMessage.successCount !== undefined && `成功: ${lastMessage.successCount}`}
                              {lastMessage.failedCount !== undefined && ` | 失败: ${lastMessage.failedCount}`}
                              {lastMessage.total !== undefined && ` | 总数: ${lastMessage.total}`}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </Message.Header>
                    <p>所有答案为空的题目已处理完毕，请查看上方日志了解详情。</p>
                  </Message>
                )}
              </div>
            )}
          </Segment>
          {/* 分类和习题集管理 */}
          <Segment>
            <CategoryAndCollectionManager onCollectionCreated={handleCollectionCreated} />
          </Segment>
        </Tab.Pane>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0', overflowY: 'auto', position: 'relative' }}>
      {/* Navigation */}
      <div style={{
        backgroundColor: '#1b1c1d',
        padding: '1rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Container>
          <Grid>
            <Grid.Row>
              <Grid.Column width={12}>
                <Header as="h2" inverted>
                  <Icon name="settings" />
                  <Header.Content>
                    后台管理系统
                  </Header.Content>
                </Header>
              </Grid.Column>
              <Grid.Column width={4} textAlign="right">
                {user ? (
                  <div>
                    <span style={{ color: '#fff', marginRight: '1em' }}>
                      <Icon name="user circle" /> {user.username} (Role: {user.role})
                    </span>
                    <Button
                      inverted
                      basic
                      icon="sign out"
                      content="退出"
                      onClick={handleLogout}
                    />
                  </div>
                ) : null}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      </div>

      <Container style={{ marginTop: '2em', marginBottom: '3em' }}>
        <Grid>
          {!user ? (
            // 未登录提示
            <Grid.Row>
              <Grid.Column>
                <Segment>
                  <Header as="h2" icon textAlign="center">
                    <Icon name="shield" />
                    <Header.Content>
                      访问受限
                    </Header.Content>
                  </Header>

                  <Message warning>
                    <Message.Header>需要登录</Message.Header>
                    <p>您需要先登录才能访问此页面。</p>
                    <p>请使用数据库中 Role ≥ 2 的账号登录以使用管理功能。</p>
                  </Message>

                  <div style={{ textAlign: 'center', marginTop: '2em' }}>
                    <Button primary size="large" as="a" href="/">
                      <Icon name="home" />
                      返回首页登录
                    </Button>
                  </div>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          ) : (user.role === undefined || user.role === null || user.role < 2) ? (
            // 已登录但权限不足或无权限信息
            <Grid.Row>
              <Grid.Column>
                <Segment>
                  <Header as="h2" icon textAlign="center">
                    <Icon name="ban" />
                    <Header.Content>
                      权限不足
                    </Header.Content>
                  </Header>

                  <Message error>
                    <Message.Header>访问被拒绝</Message.Header>
                    <p>您的账号（{user.username}）当前权限为 {user.role === undefined || user.role === null ? '未知' : user.role}，不足以访问管理后台。</p>
                    <p>只有数据库中 Role ≥ 2 的用户才能使用管理功能。</p>
                  </Message>

                  <div style={{ textAlign: 'center', marginTop: '2em' }}>
                    <Button color="red" size="large" onClick={handleLogout}>
                      <Icon name="sign out" />
                      退出登录
                    </Button>
                  </div>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          ) : (
            <>
              <Grid.Row>
                <Grid.Column>
                  <Tab menu={{ secondary: true, pointing: true }} panes={panes} activeIndex={activeTab} onTabChange={(e, { activeIndex }) => setActiveTab(activeIndex as number)} />
                </Grid.Column>
              </Grid.Row>
              {message && (
                <Grid.Row>
                  <Grid.Column>
                    <Message
                      positive={message.includes('完成') || message.includes('成功')}
                      negative={message.includes('失败') || message.includes('错误')}
                    >
                      <Message.Header>
                        {message.includes('完成') || message.includes('成功') ? '操作完成' : '操作失败'}
                        {message.includes('生成') && message.includes('成功') && (
                          <span style={{ marginLeft: '0.5em', fontSize: '0.85em' }}>
                            {message.match(/成功: (\d+), 失败: (\d+)/) && (
                              <span>
                                成功: {message.match(/成功: (\d+)/)?.[1] || 0} |
                                失败: {message.match(/失败: (\d+)/)?.[1] || 0}
                              </span>
                            )}
                          </span>
                        )}
                      </Message.Header>
                      <p>{message}</p>
                    </Message>
                  </Grid.Column>
                </Grid.Row>
              )}
            </>
          )}
        </Grid>
      </Container>
    </div>
  );
}
