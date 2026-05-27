'use client'

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from '@/components/ui/Modal'

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
}

export function TermsModal({ open, onOpenChange, title, body }: TermsModalProps) {
  const paragraphs = body.split('\n\n')

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" className="max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-3 text-sm text-foreground/90 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
