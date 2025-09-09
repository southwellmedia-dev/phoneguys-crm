/**
 * Premium Overlay Components
 * 
 * @description Modal, dialog, sheet, tooltip, popover, and overlay components with advanced features
 * Part of The Phone Guys CRM premium component library
 * 
 * @components
 * - ModalPremium: Full-featured modal with variants, sizes, and animations
 * - ConfirmModal: Pre-built confirmation dialog pattern
 * - DialogPremium: Flexible dialog system with multiple positioning options
 * - AlertDialog: Alert-style dialogs for notifications and warnings
 * - SheetContent: Slide-out drawer/sheet component
 * - Tooltip: Enhanced tooltips with variants and rich content
 * - Popover: Contextual overlays for menus, info panels, and more
 */

// Modal Components
export {
  ModalPremium,
  ConfirmModal,
  ModalTrigger,
  ModalClose,
  type ModalPremiumProps,
  type ConfirmModalProps,
} from './modal-premium';

// Dialog Components
export {
  DialogPremium,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
  AlertDialog,
  SheetContent,
  type AlertDialogProps,
} from './dialog-premium';

// Tooltip Components
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
  RichTooltip,
  KeyboardTooltip,
  type SimpleTooltipProps,
  type RichTooltipProps,
  type KeyboardTooltipProps,
} from './tooltip-premium';

// Popover Components
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  MenuPopover,
  InfoPopover,
  type MenuPopoverProps,
  type InfoPopoverProps,
} from './popover-premium';

// Search Modal
export {
  SearchModal,
} from '../overlay/search-modal';

export {
  SearchModalPremium,
} from '../overlay/search-modal-premium';