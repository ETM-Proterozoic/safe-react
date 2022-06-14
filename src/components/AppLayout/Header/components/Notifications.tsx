import { ReactElement, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IconButton, Badge, ClickAwayListener, Grow, Paper, Popper } from '@material-ui/core'
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone'
import styled from 'styled-components'
import { OptionsObject } from 'notistack'

import { ReturnValue as Props } from 'src/logic/hooks/useStateHandler'
import {
  deleteAllNotifications,
  NotificationsState,
  readNotification,
  selectNotifications,
} from 'src/logic/notifications/store/notifications'
import { black300, black500, border, primary200, primary400, sm } from 'src/theme/variables'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import { formatTime } from 'src/utils/date'
import AlertIcon from 'src/assets/icons/alert.svg'
import CheckIcon from 'src/assets/icons/check.svg'
import ErrorIcon from 'src/assets/icons/error.svg'
import InfoIcon from 'src/assets/icons/info.svg'

const NOTIFICATION_LIMIT = 4

export const getSortedNotifications = (notifications: NotificationsState): NotificationsState => {
  const unreadActionNotifications: NotificationsState = []
  const unreadNotifications: NotificationsState = []
  const readNotifications: NotificationsState = []

  for (const notification of notifications) {
    if (notification.read) {
      readNotifications.push(notification)
      continue
    }

    if (notification.action) {
      unreadActionNotifications.push(notification)
    } else {
      unreadNotifications.push(notification)
    }
  }

  return unreadActionNotifications.concat(unreadNotifications, readNotifications)
}

export const getNotificationIcon = (variant: OptionsObject['variant']): string => {
  switch (variant) {
    case 'error': {
      return ErrorIcon
    }
    case 'info': {
      return InfoIcon
    }
    case 'success': {
      return CheckIcon
    }
    case 'warning': {
      return AlertIcon
    }
    default: {
      return InfoIcon
    }
  }
}

// Props will be used in popper
const Notifications = ({ open, toggle, clickAway }: Props): ReactElement => {
  const dispatch = useDispatch()
  const notificationsRef = useRef<HTMLDivElement>(null)
  const [showAll, setShowAll] = useState<boolean>(false)

  const notifications = useSelector(selectNotifications)
  const sortedNotifications = useMemo(() => {
    return getSortedNotifications(notifications)
  }, [notifications])

  const canExpand = notifications.length > NOTIFICATION_LIMIT

  const notificationsToShow =
    canExpand && showAll ? sortedNotifications : sortedNotifications.slice(0, NOTIFICATION_LIMIT)

  const unreadCount = useMemo(() => notifications.reduce((acc, { read }) => acc + Number(!read), 0), [notifications])
  const hasUnread = unreadCount > 0

  const handleClick = () => {
    if (open) {
      notificationsToShow.forEach(({ read, options }) => {
        if (read) return
        dispatch(readNotification({ key: options!.key! }))
      })
    }
    toggle()
  }

  return (
    <>
      <Wrapper ref={notificationsRef}>
        <BellIconButton onClick={handleClick}>
          <UnreadBadge
            variant="dot"
            invisible={!hasUnread}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <NotificationsNoneIcon fontSize="small" />
          </UnreadBadge>
        </BellIconButton>
      </Wrapper>
      <Popper
        anchorEl={notificationsRef.current}
        open={open}
        placement="bottom-start"
        style={{
          zIndex: 1302,
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <ClickAwayListener mouseEvent="onClick" onClickAway={clickAway} touchEvent={false}>
              <NotificationsPopper>
                <NotificationsHeader>
                  <div>
                    <NotificationsTitle>Notifications</NotificationsTitle>
                    {hasUnread && <UnreadCount>{unreadCount}</UnreadCount>}
                  </div>
                  <ClearAllButton onClick={() => dispatch(deleteAllNotifications())}>Clear All</ClearAllButton>
                </NotificationsHeader>
                <NotificationList notifications={notificationsToShow} />
                {canExpand && (
                  <div>
                    <ExpandIconButton onClick={() => setShowAll((prev) => !prev)}>
                      {showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ExpandIconButton>
                    <Subtitle>
                      {showAll ? 'Hide' : `${notifications.length - NOTIFICATION_LIMIT} other notifications`}
                    </Subtitle>
                  </div>
                )}
              </NotificationsPopper>
            </ClickAwayListener>
          </Grow>
        )}
      </Popper>
    </>
  )
}

const NotificationList = ({ notifications }: { notifications: NotificationsState }): ReactElement => {
  if (!notifications.length) {
    return <NotificationMessage>No notifications</NotificationMessage>
  }

  return (
    <>
      <NotificationType>System updates</NotificationType>
      {notifications.map(({ options, message, timestamp, read }) => {
        return (
          <Notification key={timestamp}>
            <UnreadBadge
              variant="dot"
              overlap="circle"
              invisible={read}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <img src={getNotificationIcon(options?.variant)} />
            </UnreadBadge>
            <div>
              <NotificationMessage>{message}</NotificationMessage>
              <br />
              <Subtitle>{formatTime(timestamp)}</Subtitle>
            </div>
          </Notification>
        )
      })}
    </>
  )
}

const Wrapper = styled.div`
  width: 44px;
  height: 100%;
  display: flex;
  justify-content: center;
`

const BellIconButton = styled(IconButton)`
  &:hover {
    background: none;
  }
`

const UnreadBadge = styled(Badge)`
  .MuiBadge-badge {
    background-color: ${primary400};
  }
`

const NotificationsPopper = styled(Paper)`
  box-sizing: border-box;
  border-radius: ${sm};
  box-shadow: 0 0 10px 0 rgba(33, 48, 77, 0.1);
  margin-top: 11px;
  width: 438px;
  padding: 30px 23px;
`

const NotificationsHeader = styled.div`
  height: 41px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
`

const NotificationsTitle = styled.h4`
  display: inline;
  font-weight: 700;
  font-size: 20px;
  line-height: 26px;
`

const UnreadCount = styled.span`
  display: inline-block;
  background: ${primary200};
  border-radius: 6px;
  margin-left: 9px;
  color: ${primary400};
  text-align: center;
  width: 18px;
  height: 18px;
`

const ClearAllButton = styled.button`
  all: unset;
  cursor: pointer;
  font-style: normal;
  font-weight: 700;
  font-size: 16px;
  color: ${primary400};
`

const NotificationType = styled.h4`
  all: unset;
  display: block;
  font-weight: 400;
  font-size: 14px;
  color: ${black300};
  margin-bottom: 12px;
`

const Notification = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  > * {
    padding: 8px;
  }
`

const NotificationMessage = styled.p`
  all: unset;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: ${black500};
`

const Subtitle = styled.span`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: ${black300};
`

const ExpandIconButton = styled(IconButton)`
  box-sizing: border-box;
  background-color: ${border};
  width: 20px;
  height: 20px;
  margin-left: 10px;
  margin-right: 18px;
  > * {
    color: ${black300};
  }
`

export default Notifications
