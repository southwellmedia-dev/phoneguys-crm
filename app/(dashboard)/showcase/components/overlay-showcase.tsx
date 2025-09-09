'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Edit, 
  Trash, 
  Download,
  Upload,
  Copy,
  Share,
  Heart,
  Star,
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Link,
  ExternalLink,
  Save,
  RefreshCw
} from 'lucide-react';
import {
  // Modal Components
  ModalPremium,
  ConfirmModal,
  ModalTrigger,
  ModalClose,
  
  // Dialog Components
  DialogPremium,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
  AlertDialog,
  SheetContent,
  
  // Tooltip Components
  SimpleTooltip,
  RichTooltip,
  KeyboardTooltip,
  
  // Popover Components
  Popover,
  PopoverTrigger,
  PopoverContent,
  MenuPopover,
  InfoPopover,
  
  // Dropdown Components
  DropdownPremium,
  
  // Accordion Components
  AccordionPremium,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  FAQAccordion,
  
  // Other Components
  ButtonPremium,
  InputPremium,
  TextareaPremium,
  CheckboxPremium,
} from '@/components/premium';

export default function OverlayShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const faqItems = [
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers. For enterprise customers, we also offer invoicing options."
    },
    {
      question: "How do I track my repair status?",
      answer: "You can track your repair status in real-time through our customer portal. You'll receive updates via email and SMS at each stage of the repair process."
    },
    {
      question: "What is your warranty policy?",
      answer: "All repairs come with a 90-day warranty covering parts and labor. Extended warranty options are available for premium customers."
    },
    {
      question: "Do you offer same-day repairs?",
      answer: "Yes, we offer same-day repairs for most common issues. Priority service is available for urgent repairs."
    }
  ];

  return (
    <div className="space-y-12">
      {/* Modals Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Modals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Standard Modal */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Standard Modal</h3>
            <DialogPremium open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <ButtonPremium variant="default" size="sm">
                  Open Modal
                </ButtonPremium>
              </DialogTrigger>
              <DialogContent size="lg" variant="default">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                  <InputPremium label="Name" placeholder="Enter your name" size="sm" />
                  <InputPremium label="Email" type="email" placeholder="Enter your email" size="sm" />
                  <TextareaPremium label="Bio" placeholder="Tell us about yourself" rows={3} />
                </DialogBody>
                <DialogFooter>
                  <ButtonPremium variant="soft" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </ButtonPremium>
                  <ButtonPremium variant="gradient" size="sm" onClick={() => setModalOpen(false)}>
                    Save Changes
                  </ButtonPremium>
                </DialogFooter>
              </DialogContent>
            </DialogPremium>
          </div>

          {/* Confirmation Modal */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Confirmation Modal</h3>
            <DialogPremium open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <ButtonPremium variant="error" size="sm">
                  Delete Item
                </ButtonPremium>
              </DialogTrigger>
              <DialogContent size="sm" variant="danger">
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your item.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <ButtonPremium variant="soft" size="sm" onClick={() => setConfirmOpen(false)}>
                    Cancel
                  </ButtonPremium>
                  <ButtonPremium variant="error" size="sm" onClick={() => setConfirmOpen(false)}>
                    Delete
                  </ButtonPremium>
                </DialogFooter>
              </DialogContent>
            </DialogPremium>
          </div>

          {/* Alert Dialog */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Alert Dialog</h3>
            <ButtonPremium 
              variant="warning"
              size="sm"
              onClick={() => setAlertOpen(true)}
            >
              Show Alert
            </ButtonPremium>
            <AlertDialog
              open={alertOpen}
              onOpenChange={setAlertOpen}
              type="warning"
              title="Low Storage Warning"
              description="You're running low on storage space."
              actions={
                <>
                  <ButtonPremium variant="soft" size="sm" onClick={() => setAlertOpen(false)}>
                    Ignore
                  </ButtonPremium>
                  <ButtonPremium variant="warning" size="sm" onClick={() => setAlertOpen(false)}>
                    Manage Storage
                  </ButtonPremium>
                </>
              }
            >
              You have only 2GB of storage remaining. Consider upgrading your plan or clearing some space.
            </AlertDialog>
          </div>

          {/* Sheet/Drawer */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Sheet/Drawer</h3>
            <DialogPremium open={sheetOpen} onOpenChange={setSheetOpen}>
              <DialogTrigger asChild>
                <ButtonPremium variant="default" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </ButtonPremium>
              </DialogTrigger>
              <SheetContent side="right" size="md">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold mb-1">Settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your account settings and preferences
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notifications</label>
                      <div className="space-y-2">
                        <CheckboxPremium label="Email notifications" defaultChecked />
                        <CheckboxPremium label="SMS notifications" />
                        <CheckboxPremium label="Push notifications" defaultChecked />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Privacy</label>
                      <div className="space-y-2">
                        <CheckboxPremium label="Public profile" />
                        <CheckboxPremium label="Show online status" defaultChecked />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ButtonPremium variant="soft" size="sm" onClick={() => setSheetOpen(false)}>
                      Cancel
                    </ButtonPremium>
                    <ButtonPremium variant="gradient" size="sm">
                      Save Changes
                    </ButtonPremium>
                  </div>
                </div>
              </SheetContent>
            </DialogPremium>
          </div>
        </div>
      </section>

      {/* Tooltips Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Tooltips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Simple Tooltips */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Simple Tooltips</h3>
            <div className="flex gap-2">
              <SimpleTooltip content="Edit this item">
                <ButtonPremium variant="soft" size="sm">
                  <Edit className="w-4 h-4" />
                </ButtonPremium>
              </SimpleTooltip>
              <SimpleTooltip content="Delete this item" variant="danger">
                <ButtonPremium variant="soft" size="sm">
                  <Trash className="w-4 h-4" />
                </ButtonPremium>
              </SimpleTooltip>
              <SimpleTooltip content="Download file" variant="primary">
                <ButtonPremium variant="soft" size="sm">
                  <Download className="w-4 h-4" />
                </ButtonPremium>
              </SimpleTooltip>
            </div>
          </div>

          {/* Rich Tooltips */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Rich Tooltips</h3>
            <RichTooltip
              title="Pro Feature"
              description="This feature is only available for premium users"
              variant="info"
            >
              <ButtonPremium variant="gradient" size="sm">
                <Star className="w-4 h-4 mr-2" />
                Premium
              </ButtonPremium>
            </RichTooltip>
          </div>

          {/* Keyboard Tooltips */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Keyboard Shortcuts</h3>
            <div className="flex gap-2">
              <KeyboardTooltip keys={['Ctrl', 'S']} description="Save">
                <ButtonPremium variant="soft" size="sm">
                  <Save className="w-4 h-4" />
                </ButtonPremium>
              </KeyboardTooltip>
              <KeyboardTooltip keys={['Ctrl', 'C']} description="Copy">
                <ButtonPremium variant="soft" size="sm">
                  <Copy className="w-4 h-4" />
                </ButtonPremium>
              </KeyboardTooltip>
            </div>
          </div>

          {/* Position Variants */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Positions</h3>
            <div className="flex gap-2">
              <SimpleTooltip content="Top" side="top">
                <ButtonPremium variant="soft" size="sm">T</ButtonPremium>
              </SimpleTooltip>
              <SimpleTooltip content="Right" side="right">
                <ButtonPremium variant="soft" size="sm">R</ButtonPremium>
              </SimpleTooltip>
              <SimpleTooltip content="Bottom" side="bottom">
                <ButtonPremium variant="soft" size="sm">B</ButtonPremium>
              </SimpleTooltip>
              <SimpleTooltip content="Left" side="left">
                <ButtonPremium variant="soft" size="sm">L</ButtonPremium>
              </SimpleTooltip>
            </div>
          </div>
        </div>
      </section>

      {/* Popovers Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Popovers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Menu Popover */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Menu Popover</h3>
            <MenuPopover
              trigger={
                <ButtonPremium variant="soft">
                  <MoreVertical className="w-4 h-4" />
                </ButtonPremium>
              }
              items={[
                { label: 'Edit', icon: <Edit className="w-4 h-4" />, onClick: () => console.log('Edit') },
                { label: 'Copy', icon: <Copy className="w-4 h-4" />, onClick: () => console.log('Copy') },
                { label: 'Share', icon: <Share className="w-4 h-4" />, onClick: () => console.log('Share') },
                { separator: true },
                { label: 'Delete', icon: <Trash className="w-4 h-4" />, danger: true, onClick: () => console.log('Delete') },
              ]}
            />
          </div>

          {/* Info Popover */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Info Popover</h3>
            <InfoPopover
              trigger={
                <ButtonPremium variant="soft" size="sm">
                  <Info className="w-4 h-4" />
                </ButtonPremium>
              }
              title="About This Feature"
              description="This feature allows you to manage your repair orders efficiently. Click to learn more about the available options."
            />
          </div>

          {/* Custom Content Popover */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Custom Content</h3>
            <Popover>
              <PopoverTrigger asChild>
                <ButtonPremium variant="gradient" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </ButtonPremium>
              </PopoverTrigger>
              <PopoverContent size="lg" variant="primary">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      JD
                    </div>
                    <div>
                      <p className="text-sm font-semibold">John Doe</p>
                      <p className="text-xs text-muted-foreground">john@phoneguys.com</p>
                    </div>
                  </div>
                  <div className="border-t border-border pt-1">
                    <button className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded">
                      View Profile
                    </button>
                    <button className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded">
                      Settings
                    </button>
                    <button className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded">
                      Sign Out
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>

      {/* Dropdowns Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Dropdowns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Standard Dropdown */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Standard Dropdown</h3>
            <DropdownPremium
              trigger={
                <ButtonPremium variant="default" size="sm">
                  Options
                  <ChevronDown className="w-4 h-4 ml-2" />
                </ButtonPremium>
              }
              items={[
                { type: 'label', label: 'Actions' },
                { label: 'New File', icon: <Plus className="w-4 h-4" />, shortcut: 'Ctrl+N' },
                { label: 'Save', icon: <Save className="w-4 h-4" />, shortcut: 'Ctrl+S' },
                { label: 'Export', icon: <Download className="w-4 h-4" />, shortcut: 'Ctrl+E' },
                { type: 'separator' },
                { label: 'Settings', icon: <Settings className="w-4 h-4" /> },
                { label: 'Help', icon: <HelpCircle className="w-4 h-4" /> },
              ]}
            />
          </div>

          {/* Checkbox Dropdown */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Multi-Select</h3>
            <DropdownPremium
              trigger={
                <ButtonPremium variant="soft" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </ButtonPremium>
              }
              items={[
                { type: 'label', label: 'Status' },
                { type: 'checkbox', label: 'Active', checked: true },
                { type: 'checkbox', label: 'Pending', checked: false },
                { type: 'checkbox', label: 'Completed', checked: true },
                { type: 'separator' },
                { type: 'label', label: 'Priority' },
                { type: 'checkbox', label: 'High', checked: false },
                { type: 'checkbox', label: 'Medium', checked: true },
                { type: 'checkbox', label: 'Low', checked: false },
              ]}
            />
          </div>

          {/* Nested Dropdown */}
          <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Nested Menu</h3>
            <DropdownPremium
              trigger={
                <ButtonPremium variant="gradient" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </ButtonPremium>
              }
              items={[
                { label: 'Email', icon: <Mail className="w-4 h-4" /> },
                { label: 'Message', icon: <Phone className="w-4 h-4" /> },
                {
                  label: 'Social Media',
                  icon: <Share className="w-4 h-4" />,
                  subItems: [
                    { label: 'Facebook' },
                    { label: 'Twitter' },
                    { label: 'LinkedIn' },
                  ],
                },
                { type: 'separator' },
                { label: 'Copy Link', icon: <Link className="w-4 h-4" /> },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Accordions Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Accordions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Default Accordion */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Default Accordion</h3>
            <AccordionPremium type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What services do you offer?</AccordionTrigger>
                <AccordionContent>
                  We offer comprehensive mobile device repair services including screen replacement, battery replacement, water damage repair, and software troubleshooting for all major brands.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How long do repairs take?</AccordionTrigger>
                <AccordionContent>
                  Most common repairs can be completed within 1-2 hours. Complex repairs may take 24-48 hours. We offer express service for urgent repairs.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Do you provide warranties?</AccordionTrigger>
                <AccordionContent>
                  Yes, all our repairs come with a 90-day warranty covering parts and labor. Extended warranty options are available for premium customers.
                </AccordionContent>
              </AccordionItem>
            </AccordionPremium>
          </div>

          {/* Bordered Accordion */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Bordered Accordion</h3>
            <AccordionPremium type="single" collapsible variant="bordered" className="w-full">
              <AccordionItem value="item-1" variant="bordered">
                <AccordionTrigger variant="bordered" icon="plus-minus">
                  Pricing Information
                </AccordionTrigger>
                <AccordionContent variant="bordered">
                  Our pricing is competitive and transparent. Screen repairs start at $99, battery replacements from $49, and diagnostic services are free with any repair.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" variant="bordered">
                <AccordionTrigger variant="bordered" icon="plus-minus">
                  Business Hours
                </AccordionTrigger>
                <AccordionContent variant="bordered">
                  We're open Monday through Friday from 9 AM to 7 PM, Saturday from 10 AM to 5 PM, and closed on Sundays. Emergency repairs available 24/7.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" variant="bordered">
                <AccordionTrigger variant="bordered" icon="plus-minus">
                  Location & Contact
                </AccordionTrigger>
                <AccordionContent variant="bordered">
                  Visit us at 123 Tech Street, Downtown. Call us at (555) 123-4567 or email support@phoneguys.com for inquiries.
                </AccordionContent>
              </AccordionItem>
            </AccordionPremium>
          </div>

          {/* FAQ Accordion */}
          <div>
            <h3 className="text-sm font-semibold mb-2">FAQ Style</h3>
            <FAQAccordion items={faqItems} />
          </div>

          {/* Collapsible */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Single Collapsible</h3>
            <div className="space-y-3">
              <Collapsible
                trigger="View More Details"
                variant="separated"
                icon="chevron"
              >
                <div className="space-y-2">
                  <p>This is a single collapsible component that can be used independently.</p>
                  <p>It's perfect for showing/hiding additional information without the complexity of a full accordion.</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Supports all variants</li>
                    <li>Custom icons</li>
                    <li>Controlled or uncontrolled</li>
                  </ul>
                </div>
              </Collapsible>

              <Collapsible
                trigger="Advanced Options"
                variant="separated"
                icon="plus-minus"
                defaultOpen
              >
                <div className="space-y-3">
                  <InputPremium label="API Key" placeholder="Enter your API key" />
                  <InputPremium label="Webhook URL" placeholder="https://example.com/webhook" />
                  <CheckboxPremium label="Enable debug mode" />
                </div>
              </Collapsible>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}