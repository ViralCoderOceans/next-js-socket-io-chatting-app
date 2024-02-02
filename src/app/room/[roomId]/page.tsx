"use client"

import { useParams } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Tooltip } from 'antd';
import CustomModal from '@/components/CustomModal';
import { message as messageAntd } from 'antd';
import io from 'socket.io-client'

// const socket = io('http://localhost:3003')
const socket = io('https://chatting-app-qc67.onrender.com', {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd"
  }
})

const ChatRoom = () => {
  const router = useRouter()
  const { roomId } = useParams()
  const [isLoading, setIsLoading] = useState<any>(true)
  const [crrRoom, setCrrRoom] = useState<any>('')
  const [allRooms, setAllRooms] = useState<any>([])
  const [allMessages, setAllMessages] = useState<any>([])
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState<any>()
  const [isModalOpen, setIsModalOpen] = useState<any>(false)
  const [isLeaveRoomConfirmationModalOpen, setIsLeaveRoomConfirmationModalOpen] = useState<any>(false)
  const messagesEndRef = useRef<any>(null)
  const [room, setRoom] = useState({
    id: '',
    name: ''
  })

  useEffect(() => {
    socket.emit('joinRoom', roomId, localStorage.getItem('current-room-name'), username)

    socket.on('userJoined', (alert: any, messages: any, rooms: any) => {
      setAllMessages(messages)
      setIsLoading(false)
      setAllRooms(rooms.filter((room: any) => room.members.includes(username)).sort((a: any, b: any) =>
        b.lastMessage.time - a.lastMessage.time
      ))
    })

    socket.on('message', (messages: any, rooms: any) => {
      setAllMessages(messages)
      setIsLoading(false)
      setAllRooms(rooms.filter((room: any) => room.members.includes(username)).sort((a: any, b: any) =>
        b.lastMessage.time - a.lastMessage.time
      ))
    })

    socket.on('userUnsubscribe', (alert: any, rooms: any) => {
      const newAllRooms = rooms.filter((room: any) => room.members.includes(username)).sort((a: any, b: any) =>
        b.lastMessage.time - a.lastMessage.time
      )
      setAllRooms(newAllRooms)
      if (newAllRooms.length > 0) {
        localStorage.setItem('current-room-name', newAllRooms[0].name)
        router.push(`/room/${newAllRooms[0].id}`)
      } else {
        router.push('/')
      }
    })

    socket.on('userTying', (rooms: any) => {
      setAllRooms(rooms.filter((room: any) => room.members.includes(username)).sort((a: any, b: any) =>
        b.lastMessage.time - a.lastMessage.time
      ))
    })

    // return () => {
    //   socket.disconnect()
    // }
  }, [username, roomId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [allMessages])

  useEffect(() => {
    if (localStorage.getItem('userId')) {
      setUsername(localStorage.getItem('userId'))
    } else {
      localStorage.setItem('userId', `user-${(((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)}`)
      setUsername(`username-${(((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)}`)
    }
  }, [])

  useEffect(() => {
    if (allRooms.length > 0) {
      setCrrRoom(allRooms.filter((elm: any) => elm.id === roomId)[0])
    }
  }, [allRooms])

  const handleSendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('chatMessage', { roomId, message, username })
      setMessage('')
    }
  }

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    const formattedDate = formatDistanceToNow(date, { addSuffix: true });
    return formattedDate;
  }

  const ChatUI = ({ index, msg }: any) => {
    return (
      <div key={index} className={`w-full flex ${!(username === msg.username) ? 'justify-start' : 'justify-end'}`}>
        <div className='flex gap-2'>
          <img
            src='/assets/images/user.png'
            className={`h-8 w-8 rounded-full overflow-hidden ${!(username === msg.username) ? 'order-1' : 'order-2'}`}
          />
          <div className={`order-1 flex flex-col ${!(username === msg.username) ? 'items-start' : 'items-end'}`}>
            <div className='bg-zinc-100 rounded-lg p-1 px-2 max-w-[400px] w-fit'>
              <p
                className={`text-sm text-zinc-600 ${!(username === msg.username) ? 'text-left' : 'text-right'}`}
              >
                {username === msg.username ? 'You' : msg.username}
              </p>
              <h4 className='break-all'>{msg.message}</h4>
            </div>
            <p className={`text-xs text-zinc-600 ${!(username === msg.username) ? 'text-left' : 'text-right'}`}>{formatDate(msg.time)}</p>
          </div>
        </div>
      </div>
    )
  }

  const handleRoomChange = (room: any) => {
    localStorage.setItem('current-room-name', room.name)
    socket.emit('leaveRoom', roomId, username)
    router.push(`/room/${room.id}`)
  }

  const handleLeaveRoom = () => {
    socket.emit('unsubscribeRoom', roomId, username)
  }

  const limitRecentMessageLength = (value: any, limit: any) => {
    if (value.length > limit) {
      return value.slice(0, limit) + '...'
    }
    return value
  }

  const RoomHeader = ({ room }: any) => {
    return (
      <div
        key={room.id}
        className={`p-1 px-2 text-base font-medium rounded-lg text-black cursor-pointer flex gap-2 justify-between items-center ${room.id === roomId ? 'bg-black text-white' : 'hover:bg-zinc-100'}`}
        onClick={() => handleRoomChange(room)}
      >
        <img
          src='/assets/images/room.png'
          className='h-10 w-10 rounded-full overflow-hidden'
        />
        <div className='flex-1'>
          <div className='flex justify-between items-center'>
            <h5>{room.name}</h5>
            {
              allMessages.filter((msg: any) => msg.roomId === room.id)[0]?.chat?.length > 0 &&
              <p className={`text-sm font-normal truncate ${room.id === roomId ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {limitRecentMessageLength(formatDate(allMessages.filter((msg: any) => msg.roomId === room.id)[0].chat.slice(-1)[0].time), 15)}
              </p>
            }
          </div>
          {
            allMessages.filter((msg: any) => msg.roomId === room.id)[0]?.chat?.length > 0 &&
            <p className={`text-sm font-normal ${room.id === roomId ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {limitRecentMessageLength(allMessages.filter((msg: any) => msg.roomId === room.id)[0].chat.slice(-1)[0].message, 25)}
            </p>
          }
        </div>
      </div>
    )
  }

  const handleJoinRoom = () => {
    if (room.id.includes(' ')) {
      messageAntd.error("Room-code should not contain space");
    } else {
      if (room.id.trim() !== '' && room.name.trim() !== '') {
        router.push(`/room/${room.id}`)
        localStorage.setItem('current-room-name', room.name)
        messageAntd.success(`You have been successfully joined the room - ${room.name}`);
      } else {
        messageAntd.error('Please fill the inputs');
      }
    }
  }

  const handleOnFocus = () => {
    socket.emit('onTying', true, roomId, username)
  }

  const handleOnBlur = () => {
    socket.emit('onTying', false, roomId, username)
  }

  const TypingUI = ({ index, user }: any) => {
    return (
      <div key={index} className={`w-full flex ${!(username === user) ? 'justify-start' : 'justify-end'}`}>
        <div className='flex gap-2'>
          <img
            src='/assets/images/user.png'
            className={`h-8 w-8 rounded-full overflow-hidden ${!(username === user) ? 'order-1' : 'order-2'}`}
          />
          <div className={`order-1 flex flex-col animate-pulse ${!(username === user) ? 'items-start' : 'items-end'}`}>
            <div className='bg-zinc-100 rounded-lg p-1 px-2 max-w-[400px] w-fit'>
              <p
                className={`text-sm text-zinc-600 ${!(username === user) ? 'text-left' : 'text-right'}`}
              >
                {(username === user) ? 'You' : user}
              </p>
              <h4 className='break-all text-base text-blue-800'>Typing...</h4>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container h-screen'>
      <div className='w-full h-full px-4 md:px-0 py-6 flex flex-col md:flex-row'>
        <div className='w-[350px] border-r p-4 hidden md:block'>
          <h3 className='flex gap-1 text-lg text-zinc-600'>
            Username:
            <span className='font-medium text-black'>{username}</span>
          </h3>
          {
            allRooms.length > 0 &&
            <div className='py-8'>
              <div className='w-full flex justify-between mb-2'>
                <h5 className='text-lg text-zinc-600 self-center'>Joined Rooms</h5>
                <CustomModal
                  buttonText='Join new'
                  isModalOpen={isModalOpen}
                  showModal={() => setIsModalOpen(true)}
                  handleOk={() => setIsModalOpen(false)}
                  handleCancel={() => {
                    setIsModalOpen(false)
                    setRoom({
                      id: '',
                      name: ''
                    })
                  }}
                  footer={[
                    <button
                      key='Go back button'
                      className='bg-transparent border border-black text-base py-1.5 px-3 rounded-lg mr-2'
                      onClick={() => {
                        setIsModalOpen(false)
                        setRoom({
                          id: '',
                          name: ''
                        })
                      }}
                    >
                      Go back
                    </button>,
                    <button key='Join Room button' className='bg-black border border-black text-white text-base py-1.5 px-3 rounded-lg' onClick={handleJoinRoom}>Join Room</button>,
                  ]}
                >
                  <div className='w-full md:w-[400px] flex flex-col gap-y-6 mb-5'>
                    <div>
                      <h1 className='text-2xl font-semibold mb-2'>Join or Create a Room</h1>
                      <h3 className='text-xl font-medium mb-2'>Your username: {username}</h3>
                    </div>
                    <div className='flex flex-col gap-y-3'>
                      <div className='w-full'>
                        <input
                          type="text"
                          placeholder="Enter room code"
                          value={room.id}
                          onChange={(e) => setRoom({
                            ...room,
                            id: e.target.value
                          })}
                          className='p-2 border rounded-lg w-full'
                        />
                        <p className='text-xs text-zinc-600 p-1'>
                          *Room-code should not contain space
                        </p>
                      </div>
                      <input
                        type="text"
                        placeholder="Enter room name"
                        value={room.name}
                        onChange={(e) => setRoom({
                          ...room,
                          name: e.target.value
                        })}
                        className='p-2 border rounded-lg'
                      />
                    </div>
                  </div>
                </CustomModal>
              </div>
              <hr />
              <div className='flex flex-col gap-1 py-2'>
                {
                  allRooms.map((room: any) => <RoomHeader key={room.id} room={room} />)
                }
              </div>
            </div>
          }
        </div>
        <div className='border-b pb-2 md:hidden flex justify-between items-center'>
          <div>
            <h3 className='flex gap-1 text-lg font-medium text-black'>
              {crrRoom?.name}
            </h3>
            <h3 className='flex gap-1 text-base text-zinc-600'>
              Username:
              <span className='font-medium text-black'>{username}</span>
            </h3>
          </div>
          <button
            className='bg-black text-white text-sm py-2 px-4 rounded-lg'
            onClick={() => setIsModalOpen(true)}
          >
            Switch room
          </button>
        </div>
        <div className='flex-1 h-[calc(100%-81px)] md:h-full flex flex-col p-0 md:p-4'>
          <div className='w-full justify-between items-center hidden md:flex mb-2'>
            <h3 className='flex gap-1 text-lg font-medium text-black'>
              {crrRoom?.name}
            </h3>
            <div className='flex gap-2.5'>
              {
                crrRoom?.members?.length > 0 &&
                <div className='flex gap-1 items-center'>
                  {
                    crrRoom.members.length > 4
                      ? <>
                        {
                          crrRoom.members.slice(0, 4).map((member: any, index: any) => (
                            <Tooltip key={index} placement="topLeft" title={member}>
                              <img
                                src='/assets/images/user.png'
                                className='h-8 w-8 rounded-full overflow-hidden'
                              />
                            </Tooltip>
                          ))
                        }
                      </>
                      : <>
                        {
                          crrRoom.members.map((member: any, index: any) => (
                            <Tooltip key={index} placement="topLeft" title={member}>
                              <img
                                src='/assets/images/user.png'
                                className='h-8 w-8 rounded-full overflow-hidden'
                              />
                            </Tooltip>
                          ))
                        }
                      </>
                  }
                  {
                    crrRoom.members.length > 4 && `+ ${crrRoom.members.length - 4}`
                  }
                </div>
              }
              <CustomModal
                buttonText='Leave'
                isModalOpen={isLeaveRoomConfirmationModalOpen}
                showModal={() => setIsLeaveRoomConfirmationModalOpen(true)}
                handleOk={handleLeaveRoom}
                handleCancel={() => setIsLeaveRoomConfirmationModalOpen(false)}
                footer={[
                  <button key='No, Go back button' className='bg-transparent border border-black text-base py-1.5 px-3 rounded-lg mr-2' onClick={() => setIsLeaveRoomConfirmationModalOpen(false)}>
                    No, go back
                  </button>,
                  <button key='Leave Room button' className='bg-black border border-black text-white text-base py-1.5 px-3 rounded-lg' onClick={handleLeaveRoom}>Yes, I want to leave</button>,
                ]}
              >
                <div className='w-full md:w-[400px] flex flex-col gap-y-6 mb-2'>
                  <div>
                    <h1 className='text-2xl font-semibold mb-2'>Are you sure?</h1>
                    <h3 className='text-xl font-medium mb-2'>Do you want to leave this Room?</h3>
                  </div>
                </div>
              </CustomModal>
            </div>
          </div>
          <hr className='hidden md:block' />
          {
            isLoading
              ? <div className='flex-1 flex justify-center items-center text-center'>Loading messages...</div>
              : <>
                {
                  allMessages.filter((room: any) => room.roomId === roomId)[0].chat.length > 0
                    ? <div className='flex-1 my-4 overflow-y-auto flex flex-col gap-4 pr-2'>
                      {allMessages?.filter((room: any) => room.roomId === roomId)[0].chat?.map((msg: any, index: any) => (
                        <ChatUI key={index} index={index} msg={msg} />
                      ))}
                      {
                        crrRoom?.typingUsers?.map((user: any, index: any) => <TypingUI key={index} index={index} user={user} />)
                      }
                      <div ref={messagesEndRef} />
                    </div>
                    : <div className='flex-1 my-4 overflow-y-auto flex flex-col gap-4 pr-2'>
                      <h3 className='bg-zinc-100 rounded-lg p-2 px-3 text-center'>
                        This room don&apos;t have any conversation yet, you can start the conversation by dropping the first message
                      </h3>
                      <div>
                        {
                          crrRoom?.typingUsers?.map((user: any, index: any) => <TypingUI key={index} index={index} user={user} />)
                        }
                      </div>
                    </div>
                }
              </>
          }
          <div className='flex gap-4'>
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className='w-full p-2 px-3 border rounded-lg'
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
            />
            <button
              onClick={handleSendMessage}
              className='bg-black text-white text-base py-2 px-6 rounded-lg'
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
