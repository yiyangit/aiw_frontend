'use client';

import { useState, useEffect } from 'react';
import {
  Segment,
  Header,
  Form,
  Button,
  Input,
  TextArea,
  Select,
  Message,
  Card,
  Icon,
  List,
  Modal,
  Table,
  Label,
} from 'semantic-ui-react';
import { Category, Collection, Problem } from '@/types';
import {
  getCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  getCollections,
  getCollectionsWithProblems,
  createCollection,
  updateCollection,
  deleteCollection,
  getProblems,
} from '@/lib/api';

// 定义组件Props接口
interface CategoryAndCollectionManagerProps {
  onCollectionCreated?: () => void;
}

export default function CategoryAndCollectionManager({ onCollectionCreated }: CategoryAndCollectionManagerProps) {
  // 客户端检查状态（防止hydration错误）
  const [isClient, setIsClient] = useState(false);

  // ================== 分类相关状态 ==================
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [categoryTree, setCategoryTree] = useState<Category[] | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // ================== 习题集相关状态 ==================
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableProblems, setAvailableProblems] = useState<{ problems: string[] }>({ problems: [] });
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  // ================== 通用状态 ==================
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'categories' | 'collections'>('categories');

  // ================== 初始化加载 ==================
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    loadCategories();
    loadCollections();
  }, [isClient]);

  // ================== 分类相关函数 ==================
  const loadCategories = async () => {
    try {
      setCategoryLoading(true);
      const data = await getCategories();
      setCategories(data || []);
      const treeData = await getCategoryTree();
      setCategoryTree(treeData || []);
    } catch (error) {
      showMessage('加载分类失败', 'error');
      setCategories([]);
      setCategoryTree([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) {
      showMessage('请输入分类名称', 'error');
      return;
    }

    try {
      await createCategory({
        name: newCategoryName,
        parent_id: selectedParentCategory || undefined,
        description: newCategoryDescription || undefined,
      });
      showMessage('分类创建成功', 'success');
      setNewCategoryName('');
      setNewCategoryDescription('');
      setSelectedParentCategory('');
      loadCategories();
    } catch (error: any) {
      showMessage(error.message || '创建分类失败', 'error');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) {
      showMessage('分类名称不能为空', 'error');
      return;
    }

    try {
      await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        parent_id: editingCategory.parent_id || undefined,
        description: editingCategory.description || undefined,
      });
      showMessage('分类更新成功', 'success');
      setEditingCategory(null);
      loadCategories();
    } catch (error: any) {
      showMessage(error.message || '更新分类失败', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？如果有子分类或关联的习题集，将无法删除。')) {
      return;
    }

    try {
      await deleteCategory(id);
      showMessage('分类删除成功', 'success');
      loadCategories();
    } catch (error: any) {
      showMessage(error.message || '删除分类失败', 'error');
    }
  };

  // ================== 习题集相关函数 ==================
  const loadCollections = async () => {
    try {
      setCollectionLoading(true);
      const data = await getCollectionsWithProblems();
      setCollections(data || []);
    } catch (error) {
      showMessage('加载习题集失败', 'error');
      setCollections([]);
    } finally {
      setCollectionLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName) {
      showMessage('请输入习题集名称', 'error');
      return;
    }

    try {
      await createCollection({
        name: newCollectionName,
        description: newCollectionDescription || '',
        category_ids: selectedCategories || [],
        problem_ids: selectedProblems || [],
      });
      showMessage('习题集创建成功', 'success');
      setNewCollectionName('');
      setNewCollectionDescription('');
      setSelectedCategories([]);
      setSelectedProblems([]);
      loadCollections();
      // 通知父组件刷新习题集列表
      if (onCollectionCreated) {
        onCollectionCreated();
      }
    } catch (error: any) {
      showMessage(error.message || '创建习题集失败', 'error');
    }
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection || !editingCollection.name) {
      showMessage('习题集名称不能为空', 'error');
      return;
    }

    try {
      await updateCollection(editingCollection.id, {
        name: editingCollection.name,
        description: editingCollection.description || undefined,
        category_ids: editingCollection.category_ids,
        problem_ids: editingCollection.problem_ids || [],
      });
      showMessage('习题集更新成功', 'success');
      setEditingCollection(null);
      loadCollections();
    } catch (error: any) {
      showMessage(error.message || '更新习题集失败', 'error');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('确定要删除这个习题集吗？')) {
      return;
    }

    try {
      await deleteCollection(id);
      showMessage('习题集删除成功', 'success');
      loadCollections();
    } catch (error: any) {
      showMessage(error.message || '删除习题集失败', 'error');
    }
  };

  // ================== 工具函数 ==================
  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const getCategoryOptions = (cats: Category[] | null | undefined, depth = 0): Array<{ key: string; value: string; text: string }> => {
    const options: Array<{ key: string; value: string; text: string }> = [];
    if (!cats || !Array.isArray(cats)) {
      return options;
    }
    cats.forEach(cat => {
      options.push({
        key: cat.id,
        value: cat.id,
        text: `${'  '.repeat(depth)}${cat.name}`,
      });
      if (cat.children && cat.children.length > 0) {
        options.push(...getCategoryOptions(cat.children, depth + 1));
      }
    });
    return options;
  };

  const renderCategoryTree = (cats: Category[] | null | undefined) => {
    if (!cats || !Array.isArray(cats) || cats.length === 0) {
      return null;
    }
    return cats.map(cat => (
      <List.Item key={cat.id}>
        <List.Content>
          <List.Header>
            {cat.name}
            <Label size="mini" color="blue" style={{ marginLeft: 10 }}>{cat.path}</Label>
          </List.Header>
          <List.Description>
            {cat.description && <span>{cat.description}</span>}
          </List.Description>
          <div style={{ marginTop: 5 }}>
            <Button size="tiny" onClick={() => setEditingCategory({ ...cat })}>
              编辑
            </Button>
            <Button size="tiny" color="red" onClick={() => handleDeleteCategory(cat.id)}>
              删除
            </Button>
          </div>
        </List.Content>
        {cat.children && cat.children.length > 0 && (
          <List.List style={{ paddingLeft: 20 }}>
            {renderCategoryTree(cat.children)}
          </List.List>
        )}
      </List.Item>
    ));
  };

  // ================== 渲染 ==================
  // 非客户端状态不渲染任何Semantic UI组件
  if (!isClient) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Segment>
      <Header as="h2">
        <Icon name="folder open" />
        <Header.Content>
          分类和习题集管理
          <Header.Subheader>管理系统分类和习题集的层级关系</Header.Subheader>
        </Header.Content>
      </Header>

      {/* 消息提示 */}
      {message && (
        <Message
          positive={messageType === 'success'}
          negative={messageType === 'error'}
          onDismiss={() => setMessage('')}
        >
          {message}
        </Message>
      )}

      {/* 标签页切换 */}
      <Header as="h3">
        <Button.Group>
          <Button
            color={activeTab === 'categories' ? 'blue' : undefined}
            onClick={() => setActiveTab('categories')}
          >
            分类管理
          </Button>
          <Button
            color={activeTab === 'collections' ? 'blue' : undefined}
            onClick={() => setActiveTab('collections')}
          >
            习题集管理
          </Button>
        </Button.Group>
      </Header>

      {/* 分类管理 */}
      {activeTab === 'categories' && (
        <Segment>
          <Header as="h4">创建新分类</Header>
          <Form onSubmit={handleCreateCategory}>
            <Form.Group widths="equal">
              <Form.Field required>
                <label>分类名称</label>
                <Input
                  placeholder="输入分类名称"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </Form.Field>
              <Form.Field>
                <label>父分类（可选）</label>
                <Select
                  placeholder="选择父分类"
                  options={getCategoryOptions(categoryTree)}
                  value={selectedParentCategory}
                  onChange={(e, { value }) => setSelectedParentCategory(value as string)}
                  clearable
                />
              </Form.Field>
            </Form.Group>
            <Form.Field>
              <label>描述（可选）</label>
              <TextArea
                placeholder="输入分类描述"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </Form.Field>
            <Button type="submit" color="green" loading={categoryLoading}>
              创建分类
            </Button>
          </Form>

          <Header as="h4" style={{ marginTop: 30 }}>分类列表</Header>
          <List divided relaxed>
            {categoryTree && categoryTree.length > 0 && categoryTree.map(cat => renderCategoryTree([cat]))}
            {(!categoryTree || categoryTree.length === 0) && <List.Item>暂无分类数据</List.Item>}
          </List>
        </Segment>
      )}

      {/* 习题集管理 */}
      {activeTab === 'collections' && (
        <Segment>
          <Header as="h4">创建新习题集</Header>
          <Form onSubmit={handleCreateCollection}>
            <Form.Group widths="equal">
              <Form.Field required>
                <label>习题集名称</label>
                <Input
                  placeholder="输入习题集名称"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
              </Form.Field>
            </Form.Group>
            <Form.Field>
              <label>描述（可选）</label>
              <TextArea
                placeholder="输入习题集描述"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
              />
            </Form.Field>
            <Form.Field>
              <label>关联分类（可多选）</label>
              <Select
                placeholder="选择分类"
                options={getCategoryOptions(categoryTree)}
                value={selectedCategories}
                onChange={(e, { value }) => setSelectedCategories(value as string[])}
                multiple
              />
            </Form.Field>
            <Button type="submit" color="green" loading={collectionLoading}>
              创建习题集
            </Button>
          </Form>

          <Header as="h4" style={{ marginTop: 30 }}>习题集列表</Header>
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>名称</Table.HeaderCell>
                <Table.HeaderCell>描述</Table.HeaderCell>
                <Table.HeaderCell>题目数量</Table.HeaderCell>
                <Table.HeaderCell>分类</Table.HeaderCell>
                <Table.HeaderCell>操作</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {collections && collections.length > 0 ? collections.map(collection => (
                <Table.Row key={collection.id}>
                  <Table.Cell>{collection.name}</Table.Cell>
                  <Table.Cell>{collection.description || '-'}</Table.Cell>
                  <Table.Cell>{collection.problems?.length || 0}</Table.Cell>
                  <Table.Cell>
                    {collection.category_ids?.map(catId => {
                      const cat = categories?.find(c => c.id === catId);
                      return cat ? (
                        <Label key={catId} style={{ marginBottom: 5 }}>{cat.name}</Label>
                      ) : null;
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    <Button size="tiny" onClick={() => setEditingCollection({ ...collection })}>
                      编辑
                    </Button>
                    <Button size="tiny" color="red" onClick={() => handleDeleteCollection(collection.id)}>
                      删除
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )) : (
                <Table.Row>
                  <Table.Cell colSpan={5} style={{ textAlign: 'center' }}>暂无习题集数据</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Segment>
      )}

      {/* 编辑分类模态框 */}
      <Modal
        open={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        size="small"
      >
        <Modal.Header>编辑分类</Modal.Header>
        <Modal.Content>
          <Form onSubmit={handleUpdateCategory}>
            <Form.Field required>
              <label>分类名称</label>
              <Input
                value={editingCategory?.name || ''}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </Form.Field>
            <Form.Field>
              <label>父分类</label>
              <Select
                placeholder="选择父分类"
                options={getCategoryOptions(categoryTree)}
                value={editingCategory?.parent_id || ''}
                onChange={(e, { value }) => setEditingCategory(prev => prev ? { ...prev, parent_id: value as string } : null)}
                clearable
              />
            </Form.Field>
            <Form.Field>
              <label>描述</label>
              <TextArea
                value={editingCategory?.description || ''}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </Form.Field>
            <Button type="submit" color="blue">
              保存
            </Button>
            <Button onClick={() => setEditingCategory(null)}>
              取消
            </Button>
          </Form>
        </Modal.Content>
      </Modal>

      {/* 编辑习题集模态框 */}
      <Modal
        open={editingCollection !== null}
        onClose={() => setEditingCollection(null)}
        size="large"
      >
        <Modal.Header>编辑习题集</Modal.Header>
        <Modal.Content>
          <Form onSubmit={handleUpdateCollection}>
            <Form.Field required>
              <label>习题集名称</label>
              <Input
                value={editingCollection?.name || ''}
                onChange={(e) => setEditingCollection(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </Form.Field>
            <Form.Field>
              <label>描述</label>
              <TextArea
                value={editingCollection?.description || ''}
                onChange={(e) => setEditingCollection(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </Form.Field>
            <Form.Field>
              <label>关联分类（可多选）</label>
              <Select
                placeholder="选择分类"
                options={getCategoryOptions(categoryTree)}
                value={editingCollection?.category_ids || []}
                onChange={(e, { value }) => setEditingCollection(prev => prev ? { ...prev, category_ids: value as string[] } : null)}
                multiple
              />
            </Form.Field>
            <Button type="submit" color="blue">
              保存
            </Button>
            <Button onClick={() => setEditingCollection(null)}>
              取消
            </Button>
          </Form>
        </Modal.Content>
      </Modal>
    </Segment>
  );
}
