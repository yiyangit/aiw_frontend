'use client';

import { useState, useEffect, useRef } from 'react';
import { Form, Button, Segment, Header, Icon, Container, Message } from 'semantic-ui-react';
import { ChatMessage } from '@/types';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatInterfaceProps {
  problemId: string;
}

export default function ChatInterface({ problemId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError('');
    setStreamingContent('');

    try {
      const response = await fetch(`/api/chat/${problemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to start chat');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content' && data.content) {
                assistantContent += data.content;
                setStreamingContent(assistantContent);
              }
            } catch (e) {
              // Failed to parse SSE data
            }
          }
        }
      }

      setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
      setStreamingContent('');
    } catch (err) {
      setError('发送消息失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Segment style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <Header as="h4">
        <Icon name="chat" />
        AI 答疑
      </Header>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', padding: '0.5rem' }}>
        {messages.length === 0 && !streamingContent && (
          <Message info>
            <Message.Header>欢迎使用AI答疑喵！</Message.Header>
            <p>您可以就这道题目提出任何问题，我会为您详细解答。</p>
          </Message>
        )}

        {messages.map((message, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', color: message.role === 'user' ? '#2185d0' : '#1b5e20' }}>
              {message.role === 'user' ? '您' : 'AI助手'}：
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <MarkdownRenderer content={message.content} />
            </div>
          </div>
        ))}

        {streamingContent && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', color: '#1b5e20' }}>
              bot：
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <MarkdownRenderer content={streamingContent} />
            </div>
            {isLoading && <Icon name="ellipsis horizontal" loading />}
          </div>
        )}

        {error && (
          <Message negative>
            <Message.Header>错误</Message.Header>
            <p>{error}</p>
          </Message>
        )}

        <div ref={messagesEndRef} />
      </div>

      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Input
            fluid
            width="14"
            placeholder="请输入您的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button
            primary
            width="2"
            type="submit"
            loading={isLoading}
            disabled={!input.trim() || isLoading}
          >
            发送
          </Button>
        </Form.Group>
      </Form>
    </Segment>
  );
}