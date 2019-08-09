<?xml version="1.0" encoding="utf-8" ?>
<file>
<properties><outputs-parameters><parameter><value>1.0</value><description /><name>TIMEOUT</name><type>float</type><scope>local</scope></parameter></outputs-parameters><inputs-parameters><parameter><description /><name>CALL_ADDR</name><type>str</type><value>3333</value><scope>local</scope></parameter><parameter><description /><name>CALL_DURATION</name><type>int</type><value>60</value><scope>local</scope></parameter><parameter><value>False</value><description /><name>DEBUG</name><type>bool</type><scope>local</scope></parameter><parameter><description /><name>DISPLAY_NAME</name><type>str</type><value>denis</value><scope>local</scope></parameter><parameter><description>proxy.sipthor.net</description><name>DST_IP</name><type>str</type><value>85.17.186.7</value><scope>local</scope></parameter><parameter><description /><name>DST_PORT</name><type>int</type><value>5060</value><scope>local</scope></parameter><parameter><description /><name>LOGIN</name><type>str</type><value>dmachard</value><scope>local</scope></parameter><parameter><description /><name>PASSWORD</name><type>str</type><value>rc889r9ras</value><scope>local</scope></parameter><parameter><description>Public User Identifier</description><name>PUID</name><type>str</type><value>dmachard</value><scope>local</scope></parameter><parameter><description /><name>REALM</name><type>str</type><value>sip2sip.info</value><scope>local</scope></parameter><parameter><description /><name>RECORD_SOUND</name><type>bool</type><value>True</value><scope>local</scope></parameter><parameter><description /><name>SRC_ETH</name><type>self-eth</type><value>eth0</value><scope>local</scope></parameter><parameter><description /><name>SRC_IP</name><type>self-ip</type><value>204.62.14.177 (eth0)</value><scope>local</scope></parameter><parameter><value>204.62.14.177 (eth0)</value><description /><name>SRC_IP2</name><type>self-ip</type><scope>local</scope></parameter><parameter><description /><name>SRC_PORT</name><type>int</type><value>50000</value><scope>local</scope></parameter><parameter><value>50001</value><description /><name>SRC_PORT_RTP</name><type>int</type><scope>local</scope></parameter><parameter><value>30.0</value><description /><name>TIMEOUT</name><type>float</type><scope>local</scope></parameter></inputs-parameters><parameters /><agents><agent><description /><name>AGENT</name><value>agent-linux-socket01</value><type /></agent></agents><descriptions><description><key>author</key><value>admin</value></description><description><key>creation date</key><value>30/07/2012</value></description><description><key>summary</key><value>Just a basic sample.</value></description><description><key>prerequisites</key><value>None.</value></description><description><key>comments</key><value><comments /></value></description><description><key>libraries</key><value>v350</value></description><description><key>adapters</key><value>v450</value></description><description><key>state</key><value>Writing</value></description><description><key>requirement</key><value>REQ_01</value></description></descriptions><probes><probe><name>network01</name><active>False</active><args>{'interfaces': [{'interface': 'eth0', 'filter': ''}]}</args><type>network</type></probe></probes></properties>
<testdefinition><![CDATA[# raw
class REGISTER_CALL_RAW_01(TestCase):	
	def description(self, transport, displayRtpPackets, login, password):
		pass	
	def prepare(self, transport, displayRtpPackets, login, password):
		# Prepare adapters 
		self.sip = None
		self.rtp = None
		self.rfc2617 = None
		self.sdp = None
		self.login = login
		self.password = password
		self.displayRtpPackets = displayRtpPackets
		self.registered = False
		self.connected = False
		
		# steps definition 
		self.step1 = self.addStep( description = "initialize adapters", expected = "sip and rtp adapters ready" ,  summary="", enabled=True)
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "place a call", expected = "call connected",  summary="", enabled=True )
		self.step4 = self.addStep( description = "sending and receiving audio", expected = "audio received",  summary="", enabled=True )
		self.step5 = self.addStep( description = "hangup a call", expected = "call disconnected",  summary="", enabled=True )
		self.step6 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		
		# Initialize the sip adapter
		self.sip = SutAdapters.SIP.Client( parent=self, debug=input('DEBUG'), destIp=input('DST_IP'), 
					destPort=input('DST_PORT'), transport=transport, bindIp=input('SRC_IP2'), sipPuid=input('PUID'),
					sipDomain=input('REALM'), sipDisplayName=input('DISPLAY_NAME'), agentSupport=True, agentName=input('AGENT') ) 
		
		# Initialize the sip adapter
		self.rtp = SutAdapters.RTP.Client( parent=self, debug=input('DEBUG'), bindIp=input('SRC_IP2'),
			bindPort=input('SRC_PORT_RTP'), logLowLevelEvents=displayRtpPackets, recordRcvSound=input('RECORD_SOUND'),
			recordSndSound=input('RECORD_SOUND'), defaultSound=SutAdapters.RTP.SOUND_WHITE_NOISE	,
			payloadType=SutLibraries.Codecs.A_G711U, agentSupport=True, agentName=input('AGENT') ) 

		# Initialize the authenticator library
		self.rfc2617 = SutLibraries.Authentication.Digest(parent=self, debug=input('DEBUG'))
		
		# Initialize the SDP libraries
		self.sdp = SutLibraries.Media.SDP(parent=self, debug=input('DEBUG'), unicastAddress=input('SRC_IP2'),
								connectionAddress=input('SRC_IP2'))
		
		sipListening = self.sip.initialize(timeout=input('TIMEOUT'))
		if sipListening is None:
			self.step1.setFailed( actual = "SIP is not ready")
			self.abort()
			
		self.rtp.startListening()
		rtpListening = self.rtp.isListening( timeout=input('TIMEOUT') )
		if not rtpListening:
			self.step1.setFailed( actual = "RTP not listening")
			self.abort()
		
		self.step1.setPassed( actual = "rtp is listenning and sip is ready")
	def cleanup(self, aborted):
		# clean sip context, send unregister 
		if self.registered:
			self.info( 'unregister', bold=True )
			callid = SutAdapters.SIP.CALLID()
			
			self.sip.REGISTER(callId=callid, expires=0)
			# and wait 401 with some important checks
			expectedHeaders = { TestOperators.Contains(needle='www-authenticate'): TestOperators.Any() }
			rsp = self.sip.hasReceivedResponse( sipCode="401", sipPhrase='Unauthorized', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
			if rsp is None:
				self.step6.setFailed( actual =  'unregistration failed, 401 not received' )
			else:
				# extract headers
				sipHdrs = rsp.input('SIP', 'headers')
				auth = sipHdrs.input('www-authenticate')
				
				# respond to the challenge
				challenge = self.rfc2617.decode(challenge=auth)
				response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='REGISTER', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
				challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
																	
				# send a second unregister 
				headers = {"authorization": challengeRsp}
				self.sip.REGISTER(callId=callid, expires=0, headers=headers)													
				# and wait 200 ok
				rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase='OK', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq() )
				if rsp is None:
					self.step6.setFailed( actual =  'unregistration failed, 200 not received' )																
				else:
					self.info( "unregistered", bold=True )
					self.registered = False		
					self.step6.setPassed( actual = "unregistration successfull")
		
		# stop rtp
		self.rtp.stopListening()		
		rtpStopped = self.rtp.isStopped( timeout=input('TIMEOUT') )
		if not rtpStopped:
			self.abort( 'RTP not stopped' )
				
		# stop sip
		sipStopped = self.sip.finalize(timeout=input('TIMEOUT'))		
		if sipStopped is None:
			self.abort( 'SIP not stopped' )
			
		# reset adapters
		if self.rtp is not None:
			self.rtp.onReset()	
		if self.sip is not None:
			self.sip.onReset()			
		
	def definition(self, transport, displayRtpPackets, login, password):
		# register
		self.info( "register", bold=True)			
		callid = SutAdapters.SIP.CALLID()
		
		# send register 
		self.sip.REGISTER(callId=callid)
		# and wait 401 with some important checks
		expectedHeaders = { TestOperators.Contains(needle='www-authenticate'): TestOperators.Any() }
		rsp = self.sip.hasReceivedResponse( sipCode="401", sipPhrase='Unauthorized', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
		if rsp is None:
			self.step2.setFailed( actual = "registration failed, 401 not received")
		else:
			# extract headers
			sipHdrs = rsp.input('SIP', 'headers')
			auth = sipHdrs.input('www-authenticate')
			
			# respond to the challenge
			challenge = self.rfc2617.decode(challenge=auth)
			response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='REGISTER', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
			challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
																
			# send a second register 
			headers = {"authorization": challengeRsp}
			self.sip.REGISTER(callId=callid, headers=headers)													
			# and wait 200 ok
			rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase='OK', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq() )
			if rsp is None:
				self.step2.setFailed( actual = "registration failed, 200 not received")
			else:
				self.info( "registered", bold=True )
				self.registered = True	
				self.step2.setPassed( actual = "registration successfull")

		# place the call
		if self.registered:
			self.info( "place call", bold=True )
			sdpOffer = self.sdp.getOffer( audioPort=input('SRC_PORT_RTP') )
			callid = SutAdapters.SIP.CALLID()
			# send invite 
			self.sip.INVITE(requestUri=input('CALL_ADDR'), callId=callid, sdp=sdpOffer)
			
			# and wait 407 with some important checks
			expectedHeaders = { TestOperators.Contains(needle='proxy-authenticate'): TestOperators.Any() }
			rsp = self.sip.hasReceivedResponse( sipCode="407", sipPhrase='Proxy Authentication Required', callId=callid, timeout=input('TIMEOUT'), cseq='%s INVITE' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
			if rsp is None:
				self.step3.setFailed( actual = "call failed, 407 not received")
			else:
				# send ACK to invite
				sipHdrs = rsp.input('SIP', 'headers')
				self.sip.ACK( requestUri=self.sip.getRemoteUri(), callId=callid, cseq=self.sip.getLocalCseq(), via=self.sip.getVia(self.sip.getLocalBranch()), toHeader=sipHdrs.input('to'), fromHeader=sipHdrs.input('from'))

				# recall 
				self.info( "recall with an invite authenticated", bold=True )
				
				# extract challenge from 407
				auth = sipHdrs.input('proxy-authenticate')
				challenge = self.rfc2617.decode(challenge=auth)
				response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='INVITE', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
				challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
				
				
				# send invite authenticated and wait ringback tone
				headers = {"proxy-authorization": challengeRsp}
				self.sip.INVITE(requestUri=input('CALL_ADDR'), callId=callid, sdp=sdpOffer, headers=headers)
				rsp = self.sip.hasReceivedResponse( sipCode="180", sipPhrase=TestOperators.Any(), callId=callid, timeout=input('TIMEOUT'), cseq='%s INVITE' % self.sip.getLocalCseq() )
				if rsp is None:
					self.step3.setFailed( actual = "call failed, 180 not received")
				else:
					self.info( 'remote is ringing', bold=True )
					
					rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase=TestOperators.Any(), callId=callid, timeout=input('TIMEOUT'), cseq='%s INVITE' % self.sip.getLocalCseq() )
					if rsp is None:
						self.step3.setFailed( actual = "call failed, 200 not received")
					else:
						self.connected=True
						self.info( 'call connected', bold=True )
						
						# send ACK to invite
						sipHdrs = rsp.input('SIP', 'headers')
						contact = SutAdapters.SIP.UNQ_URI( sipHdrs.input('contact') )
						self.sip.decodeHeader_To( to=sipHdrs.input('to') )
						
						routes = self.sip.decodeHeader_RecordRoute( sipHdrs.input('record-route') ) 
						headers = {"route": routes}
						self.sip.ACK( requestUri=contact, callId=callid, cseq=self.sip.getLocalCseq(), headers=headers )
						
						self.step3.setPassed( actual = "call connected")

		if self.connected:
			# negotiate codec 
			codec, ipRtpDest, portRtpDest = self.sdp.negotiatesCodec( sdp=rsp.input('SDP') )
			if codec is None:
				self.step4.setFailed( actual = "codec negotiation failed" )
			else:
				self.rtp.setCodec(payloadType=codec)
				self.rtp.setDestination(destinationIp=ipRtpDest, destinationPort=portRtpDest)		
			
				# start sending rtp
				self.rtp.startSending()
				
				if self.displayRtpPackets:
					self.info( 'audio no checked')
				else:				
					if not self.rtp.hasStartedReceiving(timeout=input('TIMEOUT')):
						self.step4.setFailed( actual =  'no audio received' )
					else:
						self.info( 'audio received', bold=True )
						self.step4.setPassed( actual = 'audio received' )
				
				# wait
				self.wait( input('CALL_DURATION') ) 

				# stop sending rtp
				self.rtp.stopSending()			
			
			# send bye
			self.info( "disconnect the call", bold=True )
			headers = {"route": routes}
			self.sip.BYE( requestUri=contact, callId=callid, headers=headers )
			rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase=TestOperators.Any(), callId=callid, timeout=input('TIMEOUT'), cseq='%s BYE' % self.sip.getLocalCseq() )
			if rsp is None:
				self.step5.setFailed( actual =  'disconnection failed, 200 not received' )
			else:
				self.info( 'call is disconnected', bold=True )		
				self.step5.setPassed( actual =  'call is disconnected' )	
			
			if self.displayRtpPackets:
				self.info( 'audio no checked')
			else:				
				if self.rtp.hasStoppedReceiving(timeout=input('TIMEOUT')):
					self.info( 'no more audio received',  bold=True  )	
				else:
					self.setFailed()
					self.error( 'audio received')	


# with client
class REGISTER_CALLER_01(TestCase):
	def description(self, login, password):
		pass	
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull" ,  summary="", enabled=True)
		self.step3 = self.addStep( description = "remote is ringing", expected = "ringback tone received",  summary="", enabled=True )
		self.step4 = self.addStep( description = "place a call", expected = "call connected",  summary="", enabled=True )
		self.step5 = self.addStep( description = "receiving audio", expected = "audio received" ,  summary="", enabled=True)
		self.step6 = self.addStep( description = "hangup a call", expected = "call disconnected",  summary="", enabled=True )
		self.step7 = self.addStep( description = "no more receiving audio", expected = "no audio received" ,  summary="", enabled=True)
		self.step8 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		self.step9 = self.addStep( description = "unplug the phone", expected = "sip phone stopped" ,  summary="", enabled=True)
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0),
							sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		self.info( 'plug the phone', bold=True)
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")

		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		self.info( 'unplug the phone', bold=True)
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step9.setFailed( actual = 'failed to unplug' )
			else:
				self.step9.setPassed( actual = 'sip phone unplugged' )
	
#		self.wait(50)
			
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.register( headers={'test-tas': 'test-tas' } )
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.step2.setPassed( actual = "registration successfull")
		
#			self.info( "calling %s" % 'bob-tas', bold=True)	
#			sessid = self.sipPhone.placeCall( uri='bob-tas', recordCall=input('RECORD_SOUND'), 
#																				playSound=SutAdapters.RTP.SOUND_SILENCE, codecSound=SutLibraries.Codecs.A_G711U,
#																				headers={'test-tas2': 'test-tas2' }	)
#			
#			if not self.sipPhone.ringbackToneReceived(timeout=input('TIMEOUT'), sessionid=sessid):
#				self.step3.setFailed( actual = "no ringback tone received" )
#			else:
#				self.step3.setPassed( actual = "remote is ringing" )
#		
#			if not self.sipPhone.isConnected(timeout=input('TIMEOUT'), sessionid=sessid):
#				self.step4.setFailed( actual = "call failed" )
#			else:
#				self.step4.setPassed( actual = "call connected" )
#
#				if not self.sipPhone.isReceivingAudio(timeout=input('TIMEOUT'), sessionid=sessid):
#					self.step5.setFailed( actual = "no audio received" )
#				else:
#					self.step5.setPassed( actual = "audio received" )
#				
#				self.wait( input('CALL_DURATION') )
#				
#				self.info( "release" )
#				self.sipPhone.hangupCall(sessionid=sessid)
#				if not self.sipPhone.isDisconnected(timeout=input('TIMEOUT'), sessionid=sessid):
#					self.step6.setFailed( actual = "call ended failed" )
#				else:
#					self.step6.setPassed( actual = "call ended" )
#				
#					if not self.sipPhone.isNoLongerReceivingAudio(timeout=input('TIMEOUT'), sessionid=sessid):
#						self.step7.setFailed( actual = "audio received" )
#					else:
#						self.step7.setPassed( actual = "no more audio received" )				
					
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step8.setFailed( actual = "unregistration failed" )
			else:
				self.step8.setPassed( actual = "unregistered" )		
		
#		if self.sipPhone is not None:
#			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
#				self.step9.setFailed( actual = 'failed to unplug' )
#			else:
#				self.step9.setPassed( actual = 'sip phone unplugged' )	
		
	

class REGISTER_CALLEE_01(TestCase):
	def description(self, login, password):
		pass	
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "remote is ringing", expected = "ringback tone received",  summary="", enabled=True)
		self.step4 = self.addStep( description = "answer to the call", expected = "call connected",  summary="", enabled=True )
		self.step5 = self.addStep( description = "receiving audio", expected = "audio received",  summary="", enabled=True )
		self.step6 = self.addStep( description = "hangup a call", expected = "call disconnected",  summary="", enabled=True )
		self.step7 = self.addStep( description = "no more receiving audio", expected = "no audio received",  summary="", enabled=True )
		self.step8 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		self.step9 = self.addStep( description = "unplug the phone", expected = "sip phone stopped",  summary="", enabled=True )
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0),
				sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")
		
		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step9.setFailed( actual = "failed to unplug")
			else:
				self.step9.setPassed( actual = "sip phone unplugged")
		
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.register()
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.step2.setPassed( actual = "registration successfull")
		
			sessid = self.sipPhone.isRinging(timeout=input('TIMEOUT'))
			if sessid is None:
				self.step3.setFailed( actual = "no ringing" )
			else:
				self.step3.setPassed( actual = "ringing")
				
				self.info( 'answer to the call', bold=True )
				self.sipPhone.answerCall(sessionid=sessid, headers={'test-tas3': 'test-tas3' }	)
				if not self.sipPhone.isConnected(timeout=input('TIMEOUT'), sessionid=sessid):
					self.step4.setFailed( actual = "call not connected")
				else:
					self.step4.setPassed( actual = "call connected")
				
					if not self.sipPhone.isReceivingAudio(timeout=input('TIMEOUT'), sessionid=sessid):
						self.step5.setFailed( actual = "no audio received" )
					else:
						self.step5.setPassed( actual = "audio received" )
					
					self.wait( input('CALL_DURATION') )
					
					self.info( 'hangup the call', bold=True )
					self.sipPhone.hangupCall(sessionid=sessid)
					if not self.sipPhone.isDisconnected(timeout=input('TIMEOUT'), sessionid=sessid):
						self.step6.setFailed( actual = "fail to hangup the call" )
					else:
						self.step6.setPassed( actual = "call ended" )
					
						if not self.sipPhone.isNoLongerReceivingAudio(timeout=input('TIMEOUT'), sessionid=sessid):
							self.step7.setFailed( actual = "audio always received" )
						else:
							self.step7.setPassed( actual = "no more audio received" )
				
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step8.setFailed( actual = "unregistration failed" )
			else:
				self.step8.setPassed( actual = "unregistered" )

class REGISTER_CALLER_CANCELLED_01(TestCase):
	def description(self, login, password):
		pass	
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "remote is ringing", expected = "ringback tone received",  summary="", enabled=True )
		self.step4 = self.addStep( description = "hang up", expected = "call cancelled",  summary="", enabled=True )
		self.step5 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		self.step6 = self.addStep( description = "unplug the phone", expected = "sip phone stopped",  summary="", enabled=True )
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0),
		sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")
		
		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step6.setFailed( actual = 'failed to unplug' )
			else:
				self.step6.setPassed( actual = 'sip phone unplugged' )
		
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.register()
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.info( "registered", bold=True )
		
			self.info( 'place a call', bold=True )
			sessid = self.sipPhone.placeCall(uri='bob-tas')
			if not self.sipPhone.ringbackToneReceived(timeout=input('TIMEOUT'), sessionid=sessid):
				self.step3.setFailed( actual = "no ringback tone received" )
			else:
				self.step3.setPassed( actual = "remote is ringing" )
			
			self.info( 'hang up' )
			self.sipPhone.hangupCall(sessionid=sessid)
			if not self.sipPhone.isCancelled(timeout=input('TIMEOUT'), sessionid=sessid):
				self.step4.setFailed( actual = "call not cancelled" )
			else:
				self.step4.setPassed( actual = "call cancelled" )
					
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step5.setFailed( actual = "unregistration failed" )
			else:
				self.step5.setPassed( actual = "unregistered" )	
class REGISTER_CALLEE_CANCELLED_01(TestCase):
	def description(self, login, password):
		pass	
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "remote is ringing", expected = "incoming call" ,  summary="", enabled=True)
		self.step4 = self.addStep( description = "remote cancels the call", expected = "call cancelled",  summary="", enabled=True )
		self.step5 = self.addStep( description = "unregistration", expected = "unregistation successfull" ,  summary="", enabled=True)
		self.step6 = self.addStep( description = "unplug the phone", expected = "sip phone stopped",  summary="", enabled=True )
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0),
				sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")
		
		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step6.setFailed( actual = 'failed to unplug' )
			else:
				self.step6.setPassed( actual = 'sip phone unplugged' )
		
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.register()
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.step2.setPassed( actual = "registration successfull")
			
			sessid = self.sipPhone.isRinging(timeout=input('TIMEOUT'))
			if sessid is None:
				self.step3.setFailed( actual = "no incoming call detected" )
			else:
				self.step3.setPassed( actual = "ringing" )
				
				
				if not self.sipPhone.isCancelled(timeout=input('TIMEOUT'), sessionid=sessid):
					self.step4.setFailed( actual = "call not cancelled" )
				else:
					self.step4.setPassed( actual = "call cancelled" )
					
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step5.setFailed( actual = "unregistration failed" )
			else:
				self.step5.setPassed( actual = "unregistered" )	
class REGISTER_CALLER_REJECT_01(TestCase):
	def description(self, login, password):
		pass
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready" ,  summary="", enabled=True)
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "remote is ringing", expected = "ringback tone received",  summary="", enabled=True )
		self.step4 = self.addStep( description = "place a call", expected = "call rejected",  summary="", enabled=True )
		self.step5 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		self.step6 = self.addStep( description = "unplug the phone", expected = "sip phone stopped",  summary="", enabled=True )
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0), 
				sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")
		
		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step6.setFailed( actual = 'failed to unplug' )
			else:
				self.step6.setPassed( actual = 'sip phone unplugged' )
		
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.register()
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.step2.setPassed( actual = "registration successfull")
		
			self.info( 'place a call', bold=True )
			sessid = self.sipPhone.placeCall(uri='bob-tas')
			
			if not self.sipPhone.ringbackToneReceived(timeout=input('TIMEOUT'), sessionid=sessid):
				self.step3.setFailed( actual = "no ringback tone received" )
			else:
				self.step3.setPassed( actual = "remote is ringing" )
				
			if not self.sipPhone.hasReceivedError(timeout=input('TIMEOUT'), sessionid=sessid, code='603', phrase='Decline'):
				self.step4.setFailed( actual = "call rejection failed" )
			else:
				self.step4.setPassed( actual = "rejected" )
				
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step5.setFailed( actual = "unregistration failed" )
			else:
				self.step5.setPassed( actual = "unregistered" )	
class REGISTER_CALLEE_REJECT_01(TestCase):
	def description(self, login, password):
		pass	
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "ringing", expected = "incoming call" ,  summary="", enabled=True)
		self.step4 = self.addStep( description = "reject the call", expected = "call rejected",  summary="", enabled=True )
		self.step5 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		self.step6 = self.addStep( description = "unplug the phone", expected = "sip phone stopped",  summary="", enabled=True )
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0),
		sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")
		
		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step6.setFailed( actual = 'failed to unplug' )
			else:
				self.step6.setPassed( actual = 'sip phone unplugged' )
		
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.register()
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.step2.setPassed( actual = "registration successfull")
		
			sessid = self.sipPhone.isRinging(timeout=input('TIMEOUT'))
			if sessid is None:
				self.step3.setFailed( actual = "no incoming call detected" )
			else:
				self.step3.setPassed( actual = "ringing" )
				
				self.info( 'reject the call', bold=True)
				self.sipPhone.rejectCall(sessionid=sessid)
				if not self.sipPhone.isRejected(timeout=input('TIMEOUT'), sessionid=sessid ):
					self.step4.setFailed( actual = "call rejection failed" )
				else:
					self.step4.setPassed( actual = "rejected" )
					
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step5.setFailed( actual = "unregistration failed" )
			else:
				self.step5.setPassed( actual = "unregistered" )		
class REGISTER_CALLEE_AUTOANSWER_01(TestCase):
	def description(self, login, password):
		pass	
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "incoming call", expected = "call received",  summary="", enabled=True )
		self.step4 = self.addStep( description = "auto answering", expected = "call connected",  summary="", enabled=True )
		self.step5 = self.addStep( description = "receiving audio", expected = "audio received" ,  summary="", enabled=True)
		self.step6 = self.addStep( description = "hangup a call", expected = "call disconnected",  summary="", enabled=True )
		self.step7 = self.addStep( description = "no more receiving audio", expected = "no audio received",  summary="", enabled=True)
		self.step8 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		self.step9 = self.addStep( description = "unplug the phone", expected = "sip phone stopped",  summary="", enabled=True )
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0),
		sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")
		
		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step9.setFailed( actual = 'failed to unplug' )
			else:
				self.step9.setPassed( actual = 'sip phone unplugged' )
		
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.configure(autoAnswer=True)
		self.sipPhone.register()
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.step2.setPassed( actual = "registration successfull")
		
			sessid = self.sipPhone.hasReceivedCall(timeout=input('TIMEOUT'))
			if sessid is None:
				self.step3.setFailed( actual = "no incoming call detected" )
			else:
				self.step3.setPassed( actual = "incoming call" )
				
				if not self.sipPhone.isConnected(timeout=input('TIMEOUT'), sessionid=sessid):
					self.step4.setFailed( actual = "call not connected" )
				else:
					self.step4.setPassed( actual = "call connected" )
				
					if not self.sipPhone.isReceivingAudio(timeout=input('TIMEOUT'), sessionid=sessid):
						self.step5.setFailed( actual = "no audio received" )
					else:
						self.step5.setPassed( actual = "audio received" )
					
					self.wait( input('CALL_DURATION') )
					
					self.info( "release" )
					self.sipPhone.hangupCall(sessionid=sessid)
					if not self.sipPhone.isDisconnected(timeout=input('TIMEOUT'), sessionid=sessid):
						self.step6.setFailed( actual = "call ended failed" )
					else:
						self.step6.setPassed( actual = "call ended" )
					
						if not self.sipPhone.isNoLongerReceivingAudio(timeout=input('TIMEOUT'), sessionid=sessid):
							self.step7.setFailed( actual = "audio received" )
						else:
							self.step7.setPassed( actual = "no more audio received" )		
	
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step8.setFailed( actual = "unregistration failed" )
			else:
				self.step8.setPassed( actual = "unregistered" )
				
class REGISTER_CALLEE_DND_01(TestCase):
	def description(self, login, password):
		pass	
	def prepare(self, login, password):
		# Prepare adapters
		self.sipPhone= None
		
		# steps definition 
		self.step1 = self.addStep( description = "plug the phone", expected = "sip phone ready" ,  summary="", enabled=True)
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "incoming call", expected = "call received",  summary="", enabled=True )
		self.step4 = self.addStep( description = "reject the call", expected = "call rejected",  summary="", enabled=True )
		self.step5 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		self.step6 = self.addStep( description = "unplug the phone", expected = "sip phone stopped",  summary="", enabled=True)
		
		# initialize the sip phone adapter
		self.sipPhone = SutAdapters.SIP.Phone( parent=self, rtpSrc=(input('SRC_IP2'), 0), sipSrc=(input('SRC_IP2'), 0), 
		sipDest=(input('DST_IP'), input('DST_PORT')), debug=input('DEBUG'), enableTcp=False, agentSupport=True, agentName=input('AGENT') )
		
		# plug the phone
		if not self.sipPhone.plug(timeout=input('TIMEOUT')):
			self.step1.setFailed( actual = "failed to plug")
			self.abort()
		else:
			self.step1.setPassed( actual = "sip phone plugged")
		
		# configure it
		self.sipPhone.configure(puid=input('PUID'), domain=input('REALM'), displayName=input('DISPLAY_NAME'), login=input('LOGIN'), password=input('PASSWORD')) 
	def cleanup(self, aborted):
		# unplug the phone
		if self.sipPhone is not None:
			if not self.sipPhone.unplug(timeout=input('TIMEOUT')):
				self.step6.setFailed( actual = 'failed to unplug' )
			else:
				self.step6.setPassed( actual = 'sip phone unplugged' )
		
		# reset phone
		if self.sipPhone is not None:	
			self.sipPhone.onReset()
	def definition(self, login, password):
		self.info( "register", bold=True)	
		self.sipPhone.configure(dnd=True)
		self.sipPhone.register()
		if not self.sipPhone.isRegistered(timeout=input('TIMEOUT')):
			self.step2.setFailed( actual = "registration failed" )
		else:
			self.step2.setPassed( actual = "registration successfull")
		
			sessid = self.sipPhone.hasReceivedCall(timeout=input('TIMEOUT'))
			if sessid is None:
				self.step3.setFailed( actual = "no incoming call detected" )
			else:
				self.step3.setPassed( actual = "incoming call" )
				
				if not self.sipPhone.isRejected(timeout=input('TIMEOUT'), sessionid=sessid ):
					self.step4.setFailed( actual = "call rejection failed" )
				else:
					self.step4.setPassed( actual = "rejected" )
				
			self.info( "unregister", bold=True)	
			self.sipPhone.unregister()
			if not self.sipPhone.isUnregistered(timeout=input('TIMEOUT')):
				self.step5.setFailed( actual = "unregistration failed" )
			else:
				self.step5.setPassed( actual = "unregistered" )	
				

# with sniffer
class REGISTER_REG_RAW_SNIFFER_01(TestCase):	
	def description(self, transport, login, password):
		pass	
	def prepare(self, transport, login, password):
		# Prepare adapters 
		self.sip = None
		self.rfc2617 = None
		self.login = login
		self.password = password
		self.registered = False
		
		# steps definition 
		self.step1 = self.addStep( description = "initialize adapters", expected = "sip adapter ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step6 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		
		# Initialize the sip adapter
		self.sip = SutAdapters.SIP.Client( parent=self, debug=input('DEBUG'), destIp=input('DST_IP'), destPort=input('DST_PORT'), 
																				transport=transport, 
																	bindIp=input('SRC_IP'), bindPort=input('SRC_PORT'),  bindEth=input('SRC_ETH'),
																	sipPuid=input('PUID'), sipDomain=input('REALM'),
																sipDisplayName=input('DISPLAY_NAME'), sniffer=True, agentSupport=True, agentName=input('AGENT') ) 
		

		# Initialize the authenticator library
		self.rfc2617 = SutLibraries.Authentication.Digest(parent=self, debug=input('DEBUG'))
		
		sipListening = self.sip.initialize(timeout=input('TIMEOUT'))
		if sipListening is None:
			self.step1.setFailed( actual = "SIP is not ready")
			self.abort()
			
		self.step1.setPassed( actual = "sip is ready")
	def cleanup(self, aborted):
		# clean sip context, send unregister 
		if self.registered:
			self.info( 'unregister', bold=True )
			callid = SutAdapters.SIP.CALLID()
			
			self.sip.REGISTER(callId=callid, expires=0)
			# and wait 401 with some important checks
			expectedHeaders = { TestOperators.Contains(needle='www-authenticate'): TestOperators.Any() }
			rsp = self.sip.hasReceivedResponse( sipCode="401", sipPhrase='Unauthorized', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
			if rsp is None:
				self.step6.setFailed( actual =  'unregistration failed, 401 not received' )
			else:
				# extract headers
				sipHdrs = rsp.input('SIP', 'headers')
				auth = sipHdrs.input('www-authenticate')
				
				# respond to the challenge
				challenge = self.rfc2617.decode(challenge=auth)
				response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='REGISTER', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
				challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
																	
				# send a second unregister 
				headers = {"authorization": challengeRsp}
				self.sip.REGISTER(callId=callid, expires=0, headers=headers)													
				# and wait 200 ok
				rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase='OK', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq() )
				if rsp is None:
					self.step6.setFailed( actual =  'unregistration failed, 200 not received' )																
				else:
					self.info( "unregistered", bold=True )
					self.registered = False		
					self.step6.setPassed( actual = "unregistration successfull")
		
	
		# stop sip
		sipStopped = self.sip.finalize(timeout=input('TIMEOUT'))		
		if sipStopped is None:
			self.abort( 'SIP not stopped' )
			
		# reset adapters
		if self.sip is not None:
			self.sip.onReset()			
		
	def definition(self, transport, login, password):
		# register
		self.info( "register", bold=True)			
		
		callid = SutAdapters.SIP.CALLID()
		
		# send register 
		self.sip.REGISTER(callId=callid)
		# and wait 401 with some important checks
		expectedHeaders = { TestOperators.Contains(needle='www-authenticate'): TestOperators.Any() }
		rsp = self.sip.hasReceivedResponse( sipCode="401", sipPhrase='Unauthorized', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
		if rsp is None:
			self.step2.setFailed( actual = "registration failed, 401 not received")
		else:
			# extract headers
			sipHdrs = rsp.input('SIP', 'headers')
			auth = sipHdrs.input('www-authenticate')
			
			# respond to the challenge
			challenge = self.rfc2617.decode(challenge=auth)
			response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='REGISTER', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
			challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
																
			# send a second register 
			headers = {"authorization": challengeRsp}
			self.sip.REGISTER(callId=callid, headers=headers)													
			# and wait 200 ok
			rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase='OK', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq() )
			if rsp is None:
				self.step2.setFailed( actual = "registration failed, 200 not received")
			else:
				self.info( "registered", bold=True )
				self.registered = True	
				self.step2.setPassed( actual = "registration successfull")
class REGISTER_CALL_RAW_SNIFFER_01(TestCase):	
	def description(self, transport, displayRtpPackets, login, password):
		pass	
	def prepare(self, transport, displayRtpPackets, login, password):
		# Prepare adapters 
		self.sip = None
		self.rtp = None
		self.rfc2617 = None
		self.sdp = None
		self.login = login
		self.password = password
		self.displayRtpPackets = displayRtpPackets
		
		# steps definition 
		self.step1 = self.addStep( description = "initialize adapters", expected = "sip and rtp adapters ready",  summary="", enabled=True )
		self.step2 = self.addStep( description = "registration", expected = "registation successfull",  summary="", enabled=True )
		self.step3 = self.addStep( description = "place a call", expected = "call connected",  summary="", enabled=True )
		self.step4 = self.addStep( description = "sending and receiving audio", expected = "audio received" ,  summary="", enabled=True)
		self.step5 = self.addStep( description = "hangup a call", expected = "call disconnected",  summary="", enabled=True )
		self.step6 = self.addStep( description = "unregistration", expected = "unregistation successfull",  summary="", enabled=True )
		
		# Initialize the sip adapter
		self.sip = SutAdapters.SIP.Client( parent=self, debug=input('DEBUG'), destIp=input('DST_IP'), destPort=input('DST_PORT'),
																	transport=transport, bindIp=input('SRC_IP'), bindPort=input('SRC_PORT'), sipPuid=input('PUID'),
																	sipDomain=input('REALM'),
																	sipDisplayName=input('DISPLAY_NAME'), sniffer=True, bindEth=input('SRC_ETH'), agentSupport=True, agentName=input('AGENT') ) 
		
		# Initialize the sip adapter
		self.rtp = SutAdapters.RTP.Client( parent=self, debug=input('DEBUG'), bindIp=input('SRC_IP'), bindPort=input('SRC_PORT_RTP'), 
						logLowLevelEvents=displayRtpPackets, recordRcvSound=input('RECORD_SOUND'), recordSndSound=input('RECORD_SOUND'), 
				defaultSound=SutAdapters.RTP.SOUND_WHITE_NOISE	,
				payloadType=SutLibraries.Codecs.A_G711U ) 

		# Initialize the authenticator library
		self.rfc2617 = SutLibraries.Authentication.Digest(parent=self, debug=input('DEBUG'))
		
		# Initialize the SDP libraries
		self.sdp = SutLibraries.Media.SDP(parent=self, debug=input('DEBUG'), unicastAddress=input('SRC_IP'), connectionAddress=input('SRC_IP'))
		
		sipListening = self.sip.initialize(timeout=input('TIMEOUT'))
		if sipListening is None:
			self.step1.setFailed( actual = "SIP is not ready")
			self.abort()
			
		self.rtp.startListening()
		rtpListening = self.rtp.isListening( timeout=input('TIMEOUT') )
		if not rtpListening:
			self.step1.setFailed( actual = "RTP not listening")
			self.abort()
		
		self.step1.setPassed( actual = "rtp is listenning and sip is ready")
	def cleanup(self, aborted):
		# clean sip context, send unregister 
		if self.registered:
			self.info( 'unregister', bold=True )
			callid = SutAdapters.SIP.CALLID()
			
			self.sip.REGISTER(callId=callid, expires=0)
			# and wait 401 with some important checks
			expectedHeaders = { TestOperators.Contains(needle='www-authenticate'): TestOperators.Any() }
			rsp = self.sip.hasReceivedResponse( sipCode="401", sipPhrase='Unauthorized', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
			if rsp is None:
				self.step6.setFailed( actual =  'unregistration failed, 401 not received' )
			else:
				# extract headers
				sipHdrs = rsp.input('SIP', 'headers')
				auth = sipHdrs.input('www-authenticate')
				
				# respond to the challenge
				challenge = self.rfc2617.decode(challenge=auth)
				response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='REGISTER', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
				challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
																	
				# send a second unregister 
				headers = {"authorization": challengeRsp}
				self.sip.REGISTER(callId=callid, expires=0, headers=headers)													
				# and wait 200 ok
				rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase='OK', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq() )
				if rsp is None:
					self.step6.setFailed( actual =  'unregistration failed, 200 not received' )																
				else:
					self.info( "unregistered", bold=True )
					self.registered = False		
					self.step6.setPassed( actual = "unregistration successfull")
		
		# stop rtp
		self.rtp.stopListening()		
		rtpStopped = self.rtp.isStopped( timeout=input('TIMEOUT') )
		if not rtpStopped:
			self.abort( 'RTP not stopped' )
				
		# stop sip
		sipStopped = self.sip.finalize(timeout=input('TIMEOUT'))		
		if sipStopped is None:
			self.abort( 'SIP not stopped' )
			
		# reset adapters
		if self.rtp is not None:
			self.rtp.onReset()	
		if self.sip is not None:
			self.sip.onReset()			
		
	def definition(self, transport, displayRtpPackets, login, password):
		# register
		self.info( "register", bold=True)			
		self.registered = False
		self.connected = False
		callid = SutAdapters.SIP.CALLID()
		
		# send register 
		self.sip.REGISTER(callId=callid)
		# and wait 401 with some important checks
		expectedHeaders = { TestOperators.Contains(needle='www-authenticate'): TestOperators.Any() }
		rsp = self.sip.hasReceivedResponse( sipCode="401", sipPhrase='Unauthorized', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
		if rsp is None:
			self.step2.setFailed( actual = "registration failed, 401 not received")
		else:
			# extract headers
			sipHdrs = rsp.input('SIP', 'headers')
			auth = sipHdrs.input('www-authenticate')
			
			# respond to the challenge
			challenge = self.rfc2617.decode(challenge=auth)
			response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='REGISTER', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
			challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
																
			# send a second register 
			headers = {"authorization": challengeRsp}
			self.sip.REGISTER(callId=callid, headers=headers)													
			# and wait 200 ok
			rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase='OK', callId=callid, timeout=input('TIMEOUT'), cseq='%s REGISTER' % self.sip.getLocalCseq() )
			if rsp is None:
				self.step2.setFailed( actual = "registration failed, 200 not received")
			else:
				self.info( "registered", bold=True )
				self.registered = True	
				self.step2.setPassed( actual = "registration successfull")

		# place the call
		if self.registered:
			self.info( "place call", bold=True )
			sdpOffer = self.sdp.getOffer( audioPort=input('SRC_PORT_RTP') )
			callid = SutAdapters.SIP.CALLID()
			# send invite 
			self.sip.INVITE(requestUri=input('CALL_ADDR'), callId=callid, sdp=sdpOffer)
			
			# and wait 407 with some important checks
			expectedHeaders = { TestOperators.Contains(needle='proxy-authenticate'): TestOperators.Any() }
			rsp = self.sip.hasReceivedResponse( sipCode="407", sipPhrase='Proxy Authentication Required', callId=callid, timeout=input('TIMEOUT'), cseq='%s INVITE' % self.sip.getLocalCseq(), expectedHeaders = expectedHeaders )
			if rsp is None:
				self.step3.setFailed( actual = "call failed, 407 not received")
			else:
				# send ACK to invite
				sipHdrs = rsp.input('SIP', 'headers')
				self.sip.ACK( requestUri=self.sip.getRemoteUri(), callId=callid, cseq=self.sip.getLocalCseq(), via=self.sip.getVia(self.sip.getLocalBranch()), toHeader=sipHdrs.input('to'), fromHeader=sipHdrs.input('from'))

				# recall 
				self.info( "recall with an invite authenticated", bold=True )
				
				# extract challenge from 407
				auth = sipHdrs.input('proxy-authenticate')
				challenge = self.rfc2617.decode(challenge=auth)
				response, cnonce, nc = self.rfc2617.compute( username=self.login, password=self.password, realm=challenge['realm'], nonce=challenge['nonce'], method='INVITE', uri=self.sip.getRemoteUri() , qop=None, algo=None, body=None )
				challengeRsp = self.rfc2617.encode( username=self.login, realm=challenge['realm'], nonce=challenge['nonce'], uri=self.sip.getRemoteUri(), response=response, cnonce=cnonce, nc=nc)
				
				
				# send invite authenticated and wait ringback tone
				headers = {"proxy-authorization": challengeRsp}
				self.sip.INVITE(requestUri=input('CALL_ADDR'), callId=callid, sdp=sdpOffer, headers=headers)
				rsp = self.sip.hasReceivedResponse( sipCode="180", sipPhrase=TestOperators.Any(), callId=callid, timeout=input('TIMEOUT'), cseq='%s INVITE' % self.sip.getLocalCseq() )
				if rsp is None:
					self.step3.setFailed( actual = "call failed, 180 not received")
				else:
					self.info( 'remote is ringing', bold=True )
					
					rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase=TestOperators.Any(), callId=callid, timeout=input('TIMEOUT'), cseq='%s INVITE' % self.sip.getLocalCseq() )
					if rsp is None:
						self.step3.setFailed( actual = "call failed, 200 not received")
					else:
						self.connected=True
						self.info( 'call connected', bold=True )
						
						# send ACK to invite
						sipHdrs = rsp.input('SIP', 'headers')
						contact = SutAdapters.SIP.UNQ_URI( sipHdrs.input('contact') )
						self.sip.decodeHeader_To( to=sipHdrs.input('to') )
						
						routes = self.sip.decodeHeader_RecordRoute( sipHdrs.input('record-route') ) 
						headers = {"route": routes}
						self.sip.ACK( requestUri=contact, callId=callid, cseq=self.sip.getLocalCseq(), headers=headers )
						
						self.step3.setPassed( actual = "call connected")

		if self.connected:
			# negotiate codec 
			codec, ipRtpDest, portRtpDest = self.sdp.negotiatesCodec( sdp=rsp.input('SDP') )
			if codec is None:
				self.step4.setFailed( actual = "codec negotiation failed" )
			else:
				self.rtp.setCodec(payloadType=codec)
				self.rtp.setDestination(destinationIp=ipRtpDest, destinationPort=portRtpDest)		
			
				# start sending rtp
				self.rtp.startSending()
				
				if self.displayRtpPackets:
					self.info( 'audio no checked')
				else:				
					if not self.rtp.hasStartedReceiving(timeout=input('TIMEOUT')):
						self.step4.setFailed( actual =  'no audio received' )
					else:
						self.info( 'audio received', bold=True )
						self.step4.setPassed( actual = 'audio received' )
				
				# wait
				self.wait( input('CALL_DURATION') ) 

				# stop sending rtp
				self.rtp.stopSending()			
			
			# send bye
			self.info( "disconnect the call", bold=True )
			headers = {"route": routes}
			self.sip.BYE( requestUri=contact, callId=callid, headers=headers )
			rsp = self.sip.hasReceivedResponse( sipCode="200", sipPhrase=TestOperators.Any(), callId=callid, timeout=input('TIMEOUT'), cseq='%s BYE' % self.sip.getLocalCseq() )
			if rsp is None:
				self.step5.setFailed( actual =  'disconnection failed, 200 not received' )
			else:
				self.info( 'call is disconnected', bold=True )		
				self.step5.setPassed( actual =  'call is disconnected' )	
			
			if self.displayRtpPackets:
				self.info( 'audio no checked')
			else:				
				if self.rtp.hasStoppedReceiving(timeout=input('TIMEOUT')):
					self.info( 'no more audio received',  bold=True  )	
				else:
					self.setFailed()
					self.error( 'audio received')	

]]></testdefinition>
<testexecution><![CDATA[
#REGISTER_CALL_RAW_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'), transport=SutAdapters.TCP.PROTOCOL_TCP, displayRtpPackets=False)
#REGISTER_CALL_RAW_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'), transport=SutAdapters.UDP.PROTOCOL_UDP, displayRtpPackets=False)
#REGISTER_CALL_RAW_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'), transport=SutAdapters.UDP.PROTOCOL_UDP, displayRtpPackets=True)
#REGISTER_CALL_RAW_01(suffix=None).execute(login=get('LOGIN'), password='test', transport=SutAdapters.UDP.PROTOCOL_UDP, displayRtpPackets=True)
#
#REGISTER_CALLER_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
#REGISTER_CALLEE_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
#REGISTER_CALLER_CANCELLED_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
#REGISTER_CALLEE_CANCELLED_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
#REGISTER_CALLER_REJECT_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
#REGISTER_CALLEE_REJECT_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
#REGISTER_CALLEE_AUTOANSWER_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
#REGISTER_CALLEE_DND_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'))
##
REGISTER_REG_RAW_SNIFFER_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'), transport=SutAdapters.UDP.PROTOCOL_UDP)
#REGISTER_CALL_RAW_SNIFFER_01(suffix=None).execute(login=get('LOGIN'), password=get('PASSWORD'), transport=SutAdapters.UDP.PROTOCOL_UDP, displayRtpPackets=False)
]]></testexecution>
<testdevelopment>1386105847.27</testdevelopment>
</file>