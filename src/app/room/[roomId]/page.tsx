"use client"

import { socket } from '@/app/page'
import { useParams } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const ChatRoom = () => {
  const router = useRouter()
  const { roomId } = useParams()
  const [isLoading, setIsLoading] = useState<any>(true)
  const [crrRoom, setCrrRoom] = useState<any>('')
  const [allRooms, setAllRooms] = useState<any>([])
  const [allMessages, setAllMessages] = useState<any>([])
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState<any>()
  const messagesEndRef = useRef<any>(null)

  useEffect(() => {
    socket.emit('joinRoom', roomId, localStorage.getItem('current-room-name'), username)

    socket.on('userJoined', (alert: any, messages: any, rooms: any) => {
      setAllMessages(messages)
      setIsLoading(false)
      setAllRooms(rooms.sort((a: any, b: any) =>
        b.lastMessage.time - a.lastMessage.time
      ))
    })

    socket.on('message', (messages: any, rooms: any) => {
      setAllMessages(messages)
      setIsLoading(false)
      setAllRooms(rooms.sort((a: any, b: any) =>
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
      <div key={index} className={`w-full flex ${username === msg.username ? 'justify-start' : 'justify-end'}`}>
        <div className='flex gap-2'>
          <img
            src='/assets/images/user.png'
            className={`h-8 w-8 rounded-full overflow-hidden ${username === msg.username ? 'order-1' : 'order-2'}`}
          />
          <div className={`order-1 flex flex-col ${username === msg.username ? 'items-start' : 'items-end'}`}>
            <div className='bg-zinc-100 rounded-lg p-1 px-2 max-w-[400px] w-fit'>
              <p
                className={`text-sm text-zinc-600 ${username === msg.username ? 'text-left' : 'text-right'}`}
              >
                {username === msg.username ? 'You' : msg.username}
              </p>
              <h4 className='break-all'>{msg.message}</h4>
            </div>
            <p className={`text-xs text-zinc-600 ${username === msg.username ? 'text-left' : 'text-right'}`}>{formatDate(msg.time)}</p>
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

  const RoomHeader = ({ room }: any) => {
    return (
      <div
        key={room.id}
        className={`p-1 px-2 text-base font-medium rounded-lg text-black cursor-pointer flex gap-2 justify-between items-center ${room.id === roomId ? 'bg-black text-white' : 'hover:bg-zinc-100'}`}
        onClick={() => handleRoomChange(room)}
      >
        <div className='flex gap-2 items-center'>
          <img
            src='/assets/images/room.png'
            className='h-10 w-10 rounded-full overflow-hidden'
          />
          <div>
            <h5>{room.name}</h5>
            <p className={`text-sm font-normal ${room.id === roomId ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {allMessages.filter((msg: any) => msg.roomId === room.id)[0].chat.slice(-1)[0].message}
            </p>
          </div>
        </div>
        <div className='self-start'>
          <p className={`text-sm font-normal ${room.id === roomId ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {formatDate(allMessages.filter((msg: any) => msg.roomId === room.id)[0].chat.slice(-1)[0].time)}
          </p>
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
              <h5 className='flex gap-1 text-lg text-zinc-600'>Rooms</h5>
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
            <h3 className='flex gap-1 text-base text-zinc-600'>
              Username:
              <span className='font-medium text-black'>{username}</span>
            </h3>
          </div>
          <button
            className='bg-black text-white text-sm py-2 px-4 rounded-lg'
          >
            Switch room
          </button>
        </div>
        <div className='flex-1 h-[calc(100%-81px)] md:h-full flex flex-col p-0 md:p-4'>
          <div className='w-full flex justify-between'>
            <h3 className='flex gap-1 text-lg font-medium text-black'>
              {crrRoom.name}
            </h3>
            {

            }
            <div>
              {

              }
            </div>
          </div>
          <hr />
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
                      <div ref={messagesEndRef} />
                    </div>
                    : <div className='flex-1 flex justify-center items-center text-center'>This room don't have any conversation yet, you can start the conversation by dropping the first message</div>
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
