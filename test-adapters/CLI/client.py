##!/usr/bin/env python
# -*- coding: utf-8 -*-

# ------------------------------------------------------------------
# Copyright (c) 2010-2018 Denis Machard
# This file is part of the extensive automation project
#
# This library is free software; you can redistribute it and/or
# modify it under the terms of the GNU Lesser General Public
# License as published by the Free Software Foundation; either
# version 2.1 of the License, or (at your option) any later version.
#
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public
# License along with this library; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
# MA 02110-1301 USA
# -------------------------------------------------------------------

import TestExecutorLib.TestValidatorsLib as TestValidatorsLib
import TestExecutorLib.TestTemplatesLib as TestTemplatesLib
import TestExecutorLib.TestOperatorsLib as TestOperatorsLib
import TestExecutorLib.TestAdapterLib as TestAdapterLib

import sys

IPv4=4
EXT_SSH_LIB_INSTALLED=True
try:
	import paramiko
except ImportError:
	EXT_SSH_LIB_INSTALLED=False
	
import threading
import select
import socket
import io

try:
	import templates
except ImportError: # python3 support
	from . import templates
	
__NAME__="""SSHv2"""

AGENT_INITIALIZED = "AGENT_INITIALIZED"
AGENT_TYPE_EXPECTED='ssh'

class TransportSsh(object):
	def __init__(self):
		"""
		"""
		self.authenticated = False
	def is_authenticated(self):
		"""
		"""
		self.authenticated = True
		return self.authenticated
	def close(self):
		"""
		"""
		pass	
		
class Client(TestAdapterLib.Adapter):
	
	def __init__ (self, parent,  destIp, destPort=22, bindIp = '0.0.0.0', bindPort=0,  destHost='',
									login='admin', password='admin', privateKey=None, privateKeyPath=None, verbose=True,
									socketTimeout=10.0, socketFamily=IPv4,  name=None, tcpKeepAlive=True, tcpKeepAliveInterval=30,
									debug=False, logEventSent=True, logEventReceived=True, parentName=None, shared=False, sftpSupport=False,
									terminalType='vt100', terminalWidth=100, terminalHeight=200,
									agent=None, agentSupport=False):
		"""
		This class enable to use SSH v2 as client only,
		Authentication by login/password or by key are supported
		lower network layer (IP, Ethernet) are not controlable.
		
		@param parent: parent testcase
		@type parent: testcase

		@param name: adapter name used with from origin/to destination (default=None)
		@type name: string/none
		
		@param login: ssh login (default=admin)
		@type login: string
		
		@param privateKey: string private key to use to authenticate, push your public key on the remote server
		@type privateKey: string/none
		
		@param privateKeyPath: path to the private key to use to authenticate, push your public key on the remote server
		@type privateKeyPath: string/none
		
		@param password: ssh password (default=admin)
		@type password: string
		
		@param bindIp: bind on ip (source ip)
		@type bindIp: string

		@param bindPort: bind on port (source port)
		@type bindPort: integer

		@param destIp: destination ip
		@type destIp: string

		@param destPort: destination port
		@type destPort: integer

		@param destHost: destination host (automatic dns resolution)
		@type destHost: string

		@param socketFamily: SutAdapters.IP.IPv4 (default) | SutAdapters.IP.IPv6 
		@type socketFamily: intconstant

		@param socketTimeout: timeout to connect in second (default=1s)
		@type socketTimeout: float

		@param tcpKeepAlive: turn on tcp keep-alive (defaut=False)
		@type tcpKeepAlive: boolean

		@param tcpKeepAliveInterval: tcp keep-alive interval (default=30s)
		@type tcpKeepAliveInterval: float
		
		@param terminalType: terminal type to emulate (default=vt100)
		@type terminalType: string
		
		@param terminalWidth: terminal width in characters (default=300)
		@type terminalWidth: integer
		
		@param terminalHeight: terminal height in characters  (default=300)
		@type terminalHeight: integer
		
		@param debug: True to activate debug mode (default=False)
		@type debug: boolean
		
		@param verbose: False to disable verbose mode (default=True)
		@type verbose: boolean
		
		@param shared: shared adapter (default=False)
		@type shared:	boolean

		@param agent: agent to use, ssh type expected
		@type agent: string/none
		
		@param agentSupport: agent support (default=False)
		@type agentSupport:	boolean
		"""
		if not isinstance(bindPort, int):
			raise TestAdapterLib.ValueException(TestAdapterLib.caller(), "bindPort argument is not a integer (%s)" % type(bindPort) )
		if not isinstance(destPort, int):
			raise TestAdapterLib.ValueException(TestAdapterLib.caller(), "destPort argument is not a integer (%s)" % type(destPort) )

		TestAdapterLib.Adapter.__init__(self, name = __NAME__, parent = parent, 
																									realname=name, shared=shared, debug=debug, 
																									showEvts=verbose, showSentEvts=verbose, showRecvEvts=verbose,
																									agentSupport=agentSupport, agent=agent, 
																									caller=TestAdapterLib.caller(),
																									agentType=AGENT_TYPE_EXPECTED)
		if parentName is not None:
			TestAdapterLib.Adapter.setName(self, name="%s>%s" % (parentName,__NAME__)  )
		self.logEventSent = logEventSent
		self.logEventReceived = logEventReceived
		self.parent = parent
		self.__mutex__ = threading.RLock()
		if not EXT_SSH_LIB_INSTALLED:
			raise Exception('External ssh lib not installed!')
		
		# adding log
		if not agentSupport: paramiko.util.log_to_file("%s/sshlog.internal" % self.getTestResultPath() )
		
		self.socket = None
		self.sshTranport = None
		self.sshChannel = None
		self.sourceIp = bindIp
		self.sourcePort = bindPort
		self.connected = False
		self.channelOpened = False
		
		# sftp support
		self.sftpOpened = False
		self.sftpSupport = sftpSupport

		# ssh options
		self.cfg = {}	
		# transport options
		self.cfg['bind-ip'] = bindIp
		self.cfg['bind-port'] = bindPort
		self.cfg['dst-ip'] = destIp
		self.cfg['dst-port'] = destPort
		self.cfg['dst-host'] = destHost
		# tcp options
		self.cfg['tcp-keepalive'] = tcpKeepAlive
		self.cfg['tcp-keepalive-interval'] = tcpKeepAliveInterval
		# ssh 
		self.cfg['login'] = login
		self.cfg['password'] = password
		self.cfg['private-key'] = privateKey
		self.cfg['private-key-path'] = privateKeyPath
		# socket options
		self.cfg['sock-timeout'] =  socketTimeout
		self.cfg['sock-family'] =  int(socketFamily)
		
		self.cfg['terminal-type'] = terminalType
		self.cfg['terminal-width'] = terminalWidth
		self.cfg['terminal-height'] = terminalHeight
		
		self.cfg['agent-support'] = agentSupport
		if agentSupport:
			self.cfg['agent'] = agent
			self.cfg['agent-name'] = agent['name']
			self.cfg['agent-type'] = agent['type']
			
		self.TIMER_ALIVE_AGT = TestAdapterLib.Timer(parent=self, duration=20, name="keepalive-agent", callback=self.aliveAgent,
																																logEvent=False, enabled=True)
			
		self.__checkConfig()
		
		# initialize the agent with no data
		if agentSupport:
			self.prepareAgent(data={'shared': shared})
			if self.agentIsReady(timeout=30) is None:
				raise TestAdapterLib.ValueException(TestAdapterLib.caller(), "Agent %s is not ready" % self.cfg['agent-name'] )
			self.TIMER_ALIVE_AGT.start()

		
	def __checkConfig(self):
		"""
		"""
		self.debug("config: %s" % self.cfg)
		if self.cfg['agent-support'] :
			self.warning('Agent used Name=%s Type=%s' % (self.cfg['agent']['name'], self.cfg['agent']['type']) ) 
		
	def __setSource(self):
		"""
		Set the source ip and port
		"""
		if self.socket is not None:
			srcIp, srcPort = self.socket.getsockname() # ('127.0.0.1', 52318)
			self.sourceIp = srcIp
			self.sourcePort = srcPort		

	def encapsule(self, ip_event, ssh_event):
		"""
		encapsule template
		"""
		# prepare template
		tpl = TestTemplatesLib.TemplateMessage()
		if self.cfg['agent-support']:
			layer_agent= TestTemplatesLib.TemplateLayer('AGENT')
			layer_agent.addKey(name='name', data=self.cfg['agent']['name'] )
			layer_agent.addKey(name='type', data=self.cfg['agent']['type'] )
			tpl.addLayer(layer=layer_agent)
		return tpl

	def cleanSocket(self):
		"""
		Clean socket
		"""
		self.debug( 'clean the socket' )
		
		self.unsetRunning()

		try:
			# clean the socket
			if self.socket is not None:
				self.socket.close()
				self.connected = False
		except Exception as e :
			pass
			
	def onReset(self):
		"""
		On reset
		"""
		if self.cfg['agent-support']:
			self.resetAgent()
		
		self.cleanSocket()
		
	def channel(self):
		"""
		Return the channel
		"""
		return self.sshChannel
		
	def receivedNotifyFromAgent(self, data):
		"""
		Function to reimplement
		"""
		self.debug( data )
		if 'cmd' in data and data['cmd'] == AGENT_INITIALIZED:
					tpl = TestTemplatesLib.TemplateMessage()
					layer = TestTemplatesLib.TemplateLayer('AGENT')
					layer.addKey("ready", True)
					layer.addKey(name='name', data=self.cfg['agent']['name'] )
					layer.addKey(name='type', data=self.cfg['agent']['type'] )
					tpl.addLayer(layer= layer)
					self.logRecvEvent( shortEvt = "Agent Is Ready" , tplEvt = tpl )	
		else:
			if 'ssh-event' in data:
				if data['ssh-event'] == 'initialized':
					self.sourceIp = data['src-ip']
					self.sourcePort = data['src-port']		
				elif data['ssh-event'] == 'connected':
					self.connected = True
					self.onConnection()
				elif data['ssh-event'] == 'connection-failed':
					self.onConnectionFailed(errno=data['err-no'], errstr=data['err-str'])		
				elif data['ssh-event'] == 'connection-timeout':
					self.onConnectionTimeout(e=data['more'])	
				elif data['ssh-event'] == 'connection-refused':
					self.onConnectionRefused()	
				elif data['ssh-event'] == 'disconnected-by-peer':
					self.onDisconnectionByPeer(e=data['more'])
				elif data['ssh-event'] == 'closed':
					self.onDisconnection()		
				elif data['ssh-event'] == 'negotiation-ok':
					self.sshTranport = TransportSsh()
					self.onNegotiationOk()		
				elif data['ssh-event'] == 'negotiation-failed':
					#self.debug(data['err'])
					self.onNegotiationFailed(err=data['err'])		
				elif data['ssh-event'] == 'authentication-ok':
					self.sshTranport.authenticated = True
					self.onAuthenticationOk()
				elif data['ssh-event'] == 'authentication-failed':
					#self.debug(data['err'])
					self.onAuthenticationFailed(err=data['err'])
				elif data['ssh-event'] == 'channel-opened':
					self.channelOpened = True
					self.onChannelOpened()
				else:
						self.error("agent mode - ssh event unknown on notify: %s" % data['ssh-event'] )

	def receivedErrorFromAgent(self, data):
		"""
		Function to reimplement
		"""
		if data['ssh-event'] == 'on-run':
			self.error( "error: %s" % data['more'] )
		elif data['ssh-event'] == 'socket-error':
			self.onSocketError(e=data['more'])
		elif data['ssh-event'] == 'connect-error':
			self.error( "connect error: %s" % data['more'] )
			self.disconnect()
		elif data['ssh-event'] == 'send-data-error':
			self.error( "error on send data: %s" % data['more'] )
		else:
			self.error("agent mode - ssh event unknown on error: %s" % data['ssh-event'] )	
			
	def receivedDataFromAgent(self, data):
		"""
		Function to reimplement
		"""
		if len(data) == 0:
			self.onIncomingData(noMoreData=True)
		else:
			self.onIncomingData(data=data)

	def sendNotifyToAgent(self, data):
		"""
		"""
		self.parent.sendNotifyToAgent(adapterId=self.getAdapterId(), agentName=self.cfg['agent-name'], agentData=data)
		
	def initAgent(self, data):
		"""
		Init agent
		"""
		self.parent.sendInitToAgent(adapterId=self.getAdapterId(), agentName=self.cfg['agent-name'], agentData=data)
		
	def prepareAgent(self, data):
		"""
		prepare agent
		"""
		self.parent.sendReadyToAgent(adapterId=self.getAdapterId(), agentName=self.cfg['agent-name'], agentData=data)
		
	def resetAgent(self):
		"""
		Reset agent
		"""
		self.parent.sendResetToAgent(adapterId=self.getAdapterId(), agentName=self.cfg['agent-name'], agentData='')
		
	def aliveAgent(self):
		"""
		Keep alive agent
		"""
		self.parent.sendAliveToAgent(adapterId=self.getAdapterId(), agentName=self.cfg['agent-name'], agentData='')
		self.TIMER_ALIVE_AGT.restart()
		
	def agentIsReady(self, timeout=1.0):
		"""
		Waits to receive agent ready event until the end of the timeout
		
		@param timeout: time max to wait to receive event in second (default=1s)
		@type timeout: float	
		
		@return: an event matching with the template or None otherwise
		@rtype: templatemessage		
		"""
		tpl = TestTemplatesLib.TemplateMessage()
		layer = TestTemplatesLib.TemplateLayer('AGENT')
		layer.addKey("ready", True)
		layer.addKey(name='name', data=self.cfg['agent']['name'] )
		layer.addKey(name='type', data=self.cfg['agent']['type'] )
		tpl.addLayer(layer= layer)
		evt = self.received( expected = tpl, timeout = timeout )
		return evt

	
	def connect(self):
		"""
		Start the TCP connection
		"""
		if self.connected:
			self.debug( 'already connected' )
			return 
			
		# Optional: resolve hostname
		if self.cfg['dst-host'] != '':
			self.cfg['dst-ip'] =  socket.gethostbyname( self.cfg['dst-host'] ) 
			if not len(self.cfg['dst-ip']):
				return 

		# Start the tcp connection
		self.debug( 'connection started' )

		if self.cfg['agent-support']:
			remote_cfg = {
							'cmd': 'connect',
							'bind-ip': self.cfg['bind-ip'], 'bind-port': self.cfg['bind-port'],
							'sock-timeout': self.cfg['sock-timeout'], 'tcp-keepalive': self.cfg['tcp-keepalive'],
							'tcp-keepalive-interval': self.cfg['tcp-keepalive-interval'] ,
							'sock-family': self.cfg['sock-family'],
							'dst-ip': self.cfg['dst-ip'], 'dst-port':self.cfg['dst-port'],
							'shared': self.isShared()
						}
			self.sendNotifyToAgent(data=remote_cfg)

		else:
			try:
				# set the socket version
				if self.cfg['sock-family'] == 4:
					sockType = TestAdapterLib.INIT_STREAM_SOCKET
				elif  self.cfg['sock-family'] == 6:
					sockType = TestAdapterLib.INIT6_STREAM_SOCKET
				else:
					raise Exception('socket family unknown: %s' % str(self.cfg['sock-family']) )	
				
				# Create the socket
				self.socket = TestAdapterLib.getSocket(sockType=sockType)
				self.socket.setsockopt(socket.SOL_TCP, socket.TCP_NODELAY, 1)
				if self.cfg['tcp-keepalive']:
					# active tcp keep alive
					self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
					# seconds before sending keepalive probes
					self.socket.setsockopt(socket.SOL_TCP, socket.TCP_KEEPIDLE, self.cfg['tcp-keepalive-interval'] ) 
					# interval in seconds between keepalive probes
					self.socket.setsockopt(socket.SOL_TCP, socket.TCP_KEEPINTVL, self.cfg['tcp-keepalive-interval']) 
					# failed keepalive probes before declaring the other end dead
					self.socket.setsockopt(socket.SOL_TCP, socket.TCP_KEEPCNT, 5) 
	
				self.socket.settimeout( self.cfg['sock-timeout'] )
				self.debug( 'bind socket on %s:%s' % (self.cfg['bind-ip'], self.cfg['bind-port']) )
				self.socket.bind( (self.cfg['bind-ip'], self.cfg['bind-port']) )
	
				# Connect the socket
				self.socket.connect( (self.cfg['dst-ip'], self.cfg['dst-port']) )
				
				# Connection successful
				self.__setSource()	
				self.connected = True
				self.onConnection()
	
				# start thread
				self.setRunning()
			except socket.timeout as e:
				self.onConnectionTimeout(e)
			except socket.error as e:
				(errno, errstr) = e
				if errno == 111:
					self.onConnectionRefused()
				else:
					self.onConnectionFailed(errno=errno, errstr=errstr)
			except Exception as e:
				self.error( "connect error: %s" % str(e) )
				self.disconnectTcp()

	
	def disconnect(self):
		"""
		Close the TCP connection
		"""
		self.__mutex__.acquire()
		if self.connected:
			self.debug( 'disconnection started' )

			if self.cfg['agent-support']:
				self.unsetRunning()
				remote_cfg = {'cmd': 'disconnect'}
				self.sendNotifyToAgent(data=remote_cfg)
				self.debug( 'reset sent to agent' )
			else:
				self.cleanSocket()
				self.onDisconnection()

		self.__mutex__.release()
		

	def onConnection(self):
		"""
		On connection
		"""
		self.debug( "connected" )

		# start ssh negotation
		self.negotiation()
		
	def onDisconnection(self):
		"""
		On disconnection
		"""
		self.channelOpened = False
		self.connected = False
		self.debug( "disconnected" )

		self.unsetRunning()
		self.sshChannel = None
		
	def onDisconnectionByPeer(self, e):
		"""
		On disconnection by peer
		"""
		self.debug("disconnected by the server: %s" % str(e) )
	
		self.cleanSocket()

	def onConnectionRefused(self):
		"""
		On connection refused
		"""
		self.__setSource()	
		self.debug( "connection refused" )

		self.cleanSocket()

	def onConnectionTimeout(self, e):
		"""
		On connection timeout
		"""
		self.__setSource()
		self.debug( "connection timeout: %s" % str(e) )

		self.cleanSocket()

	def onConnectionFailed(self, errno, errstr):
		"""
		On connection failed
		"""
		self.debug( "connection failed" )

		self.cleanSocket()


	def onSocketError(self, e):
		"""
		On socket error
		"""
		self.error( "socket error: %s" % str(e) )

		self.cleanSocket()

	def notifyAgent(self, cfg):
		"""
		"""
		self.sendNotifyToAgent(data=cfg)
		
	
	def negotiation(self):
		"""
		Start ssh negotiation
		"""
		if not self.connected:
			self.debug( 'tcp not connected' )
			return
			

		if self.cfg['agent-support']:
			remote_cfg = { 'cmd': 'negotiation'}
			self.sendNotifyToAgent(data=remote_cfg)
		else:
			t = threading.Thread(target=self.__negotiation)
			t.start()

	def __negotiation(self):
		"""
		Sub function to start the negotiation
		"""
		self.sshTranport = paramiko.Transport(self.socket)
		try:
			self.sshTranport.start_client()
		except Exception as e:	
			#self.error( e ) 
			self.onNegotiationFailed(err="%s" % e)
		
		# nego ok
		else:
			self.onNegotiationOk()
			
	def onNegotiationOk(self):
		"""
		On negotiation ok
		"""
		# auth with password
		self.authentication()
		
	def onNegotiationFailed(self, err=""):
		"""
		On negotiation failed
		"""
		# close transport
		if self.sshTranport is not None:
			self.sshTranport.close()
		self.sshTranport = None
		self.connected = False
		
		self.handleConnectionFailed(err=err)
	
	
	def authentication(self):
		"""
		authentication ssh with login and password
		"""
		if self.sshTranport is None:
			self.debug( 'negotiation todo before' )
			return
			

		if self.cfg['agent-support']:
			remote_cfg = { 'cmd': 'authentication', 'login': self.cfg['login'], 'password': self.cfg['password'] }
			if self.cfg['private-key'] is not None:
				remote_cfg['private-key'] = self.cfg['private-key']
			else:
				remote_cfg['private-key'] = ''
			self.sendNotifyToAgent(data=remote_cfg)
		else:
			try:
				if self.cfg['private-key']  is not None or self.cfg['private-key-path'] is not None  :
					key = self.sshTranport.get_remote_server_key()
					
					if self.cfg['private-key-path'] is not None:
						f = open(self.cfg['private-key-path'], 'r')
						self.cfg['private-key'] = f.read()
						f.close()
						
					# read first line of the private key to detect the type
					key_head=self.cfg['private-key'].splitlines()[0]
					if 'DSA' in key_head:
						keytype=paramiko.DSSKey
					elif 'RSA' in key_head:
						keytype=paramiko.RSAKey
					else:
						raise Exception("Invalid key type: %s" % key_head)
					
					# construct the key
					keyfile = io.StringIO( unicode(self.cfg['private-key']) )
					pkey=keytype.from_private_key(keyfile)
					
					# try to make the authen
					self.sshTranport.auth_publickey(self.cfg['login'], pkey)
				else:
					self.sshTranport.auth_password(self.cfg['login'], self.cfg['password'])
			except Exception as e:
				#self.debug( e ) 
				self.onAuthenticationFailed(err="%s" % e )
			
			# authen ok 
			else:
				self.onAuthenticationOk()
					
	def onAuthenticationOk(self):
		"""
		On authentication ok
		"""
		# open session
		self.openSession()
		
	def onAuthenticationFailed(self, err=""):
		"""
		On authentication failed
		"""
		# close transport
		if self.sshTranport is not None:
			self.sshTranport.close()
		self.sshTranport = None
		self.connected = False
		
		self.handleConnectionFailed(err=err)
	def handleConnectionFailed(self, err):
		"""
		"""
		pass
	
	def openSession(self):
		"""
		Open a ssh session
		"""
		if self.sshTranport is None:
			return
			
		if not self.sshTranport.is_authenticated():
			self.debug( 'not authenticated' )
			return
			

		if self.cfg['agent-support']:
			remote_cfg = { 'cmd': 'open-session', 'sftp-support':  self.sftpSupport,  'terminal-type': self.cfg['terminal-type'],
														'terminal-width': self.cfg['terminal-width'] , 'terminal-height': self.cfg['terminal-height']}
			self.sendNotifyToAgent(data=remote_cfg)
		else:
			try:
				self.sshChannel = self.sshTranport.open_session()
				self.sshChannel.get_pty(term=self.cfg['terminal-type'],
																					width=self.cfg['terminal-width'] , height =self.cfg['terminal-height'] )
				self.sshChannel.invoke_shell()
				self.sshChannel.settimeout(0.0)
			except Exception as e:
				self.onChannelOpeningFailed(err="%s" % e)
			else:
				self.onChannelOpened()

	def onChannelOpened(self):
		"""
		On channel opened
		"""
		self.channelOpened = True

		# begin to run
		self.setRunning()
		
	def onChannelOpeningFailed(self, err=""):
		"""
		On channel opening failed
		"""
		# close transport
		if self.sshTranport is not None:
			self.sshTranport.close()
		self.sshTranport = None
		self.sshChannel = None
		
	def onRun(self):
		"""
		"""
		try:
			if self.connected:
				if self.channelOpened:
					if self.cfg['agent-support']:
						pass
					else:
						r, w, e = select.select([self.sshChannel], [], [self.sshChannel])
						if self.sshChannel in r:
							data = self.sshChannel.recv(2048)
							# no data
							if len(data) == 0:
								self.onIncomingData(noMoreData=True)
								raise EOFError("nothing to read: disconnecting")
							
							# incoming data
							self.onIncomingData(data=data)
		except EOFError as e:
				self.onDisconnectionByPeer(e)
		except socket.error as e:
			self.onSocketError(e)
		except Exception as e:
			self.error( "on run %s" % str(e) )

	def onIncomingData(self, data=None, noMoreData=False):
		"""
		On incoming data
		"""
		try:
			if noMoreData:
				self.handleNoMoreData()
			else:
				# handle data
				self.handleIncomingData( data )
		except Exception as e:
			self.error( "on incoming ssh data: %s" % e )
			
	def handleIncomingData(self, data):
		"""
		Function to overwrite
		Called on incoming data
		
		@param data: tcp data received
		@type data: string
		
		@param lower: template tcp data received
		@type lower: templatemessage
		"""
		pass

	def handleNoMoreData(self):
		"""
		Function to reimplement
		
		@param lower:
		@type lower:
		 """
		pass

	def getExpectedTemplate(self, event, versionIp=None, sourceIp=None, destinationIp=None, sourcePort=None, destinationPort=None):
		"""
		Return an expected template with ip and tcp layers
		"""
		# prepare template
		tpl = TestTemplatesLib.TemplateMessage()
		if self.cfg['agent-support']:
			layer_agent= TestTemplatesLib.TemplateLayer('AGENT')
			layer_agent.addKey(name='name', data=self.cfg['agent']['name'] )
			layer_agent.addKey(name='type', data=self.cfg['agent']['type'] )
			
			tpl.addLayer(layer=layer_agent)
		return tpl
		
	
	def sendData(self, tpl=None, dataRaw=None):
		"""
		Send ssh data

		@param tpl: ssh template data (default=None)
		@type tpl: templatelayer/none
		
		@param dataRaw: ssh data (default=None)
		@type dataRaw: string/none
	
		@return: an event matching with the template or None otherwise
		@rtype: templatemessage	
		"""
		if self.sshTranport is None:
			return
			
		if not self.sshTranport.is_authenticated():
			self.debug( 'not authenticated' )
			return
			
		if not self.connected:
			self.debug( "not connected" )
			return

		self.debug( dataRaw )	
		if dataRaw is None:
			return

		if self.cfg['agent-support']:
			remote_cfg = { 'cmd': 'send-data', 'data': dataRaw }
			self.sendNotifyToAgent(data=remote_cfg)
		else:
			try:
				self.sshChannel.send(dataRaw)
			except Exception as e:
				self.error("unable to send data through ssh: %s" % str(e) )
#		return tpl_final
		
