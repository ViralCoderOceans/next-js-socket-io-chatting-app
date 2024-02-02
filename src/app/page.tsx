"use client"

import { message } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'

export const socket = io('http://localhost:3003')

const App = () => {
  const [room, setRoom] = useState({
    id: '',
    name: ''
  })
  const router = useRouter()
  const [username, setUsername] = useState<any>()

  const handleJoinRoom = () => {
    if (room.id.includes(' ')) {
      message.error("Room-code should not contain space");
    } else {
      if (room.id.trim() !== '' && room.name.trim() !== '') {
        router.push(`/room/${room.id}`)
        localStorage.setItem('current-room-name', room.name)
        message.success(`You have been successfully joined the room - ${room.name}`);
      } else {
        message.error('Please fill the inputs');
      }
    }
  }

  useEffect(() => {
    if (localStorage.getItem('userId')) {
      setUsername(localStorage.getItem('userId'))
    } else {
      localStorage.setItem('userId', `user-${(((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)}`)
      setUsername(`username-${(((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)}`)
    }
  }, [])

  return (
    <div className='container h-screen flex justify-center items-center'>
      <div className='w-full md:w-[400px] flex flex-col gap-y-6 p-6 md:bg-zinc-50 md:border border-zinc-100 rounded-lg md:shadow-xl'>
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
        <button className='bg-black text-white text-lg py-2 rounded-lg' onClick={handleJoinRoom}>Join Room</button>
      </div>
    </div>
  )
}

export default App
