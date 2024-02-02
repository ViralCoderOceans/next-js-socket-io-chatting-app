import { Modal } from 'antd'
import React from 'react'

const CustomModal = ({
  title,
  buttonText,
  isModalOpen,
  showModal,
  handleOk,
  handleCancel,
  footer,
  children
}: {
  title?: string | undefined,
  buttonText: string,
  isModalOpen: any,
  showModal: any,
  handleOk: any,
  handleCancel: any,
  footer: any,
  children: any
}) => {
  return (
    <>
      <button
        onClick={showModal}
        className='bg-black text-white text-base py-1.5 px-4 rounded-lg'
      >
        {buttonText}
      </button>
      <Modal
        title={title}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={footer}
        className='flex justify-center items-center'
      >
        {children}
      </Modal>
    </>
  )
}

export default CustomModal
