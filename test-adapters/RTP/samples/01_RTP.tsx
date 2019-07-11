<?xml version="1.0" encoding="utf-8" ?>
<file>
<properties><descriptions><description><key>author</key><value>admin</value></description><description><key>creation date</key><value>23/06/2019 21:42:03</value></description><description><key>summary</key><value>Just a basic sample.</value></description><description><key>prerequisites</key><value>None.</value></description><description><key>comments</key><value><comments /></value></description><description><key>libraries</key><value>deprecated</value></description><description><key>adapters</key><value>deprecated</value></description><description><key>state</key><value>Writing</value></description><description><key>requirement</key><value>REQ_01</value></description></descriptions><probes><probe><active>False</active><args /><name>probe01</name><type>default</type></probe></probes><inputs-parameters><parameter><type>bool</type><name>DEBUG</name><description /><value>False</value><color /><scope>local</scope></parameter><parameter><type>float</type><name>TIMEOUT</name><description /><value>10.0</value><color /><scope>local</scope></parameter><parameter><type>bool</type><name>VERBOSE</name><description /><value>True</value><color /><scope>local</scope></parameter></inputs-parameters><outputs-parameters><parameter><type>float</type><name>TIMEOUT</name><description /><value>60.0</value><color /><scope>local</scope></parameter></outputs-parameters><agents><agent><name>AGENT</name><description /><value>agent-dummy01</value><type>dummy</type></agent></agents></properties>
<testdefinition><![CDATA[
class RTP_01(TestCase):	
	def description(self):
		# steps definition 
		self.step1 = self.addStep( description = "sending and receiving audio", expected = "audio received" )

	def prepare(self):

		# Initialize the sip adapter
		self.rtp = SutAdapters.RTP.Client( parent=self, 
																										debug=get('DEBUG'), 
																										bindIp=get('SRC_IP'), 
																										bindPort=get('SRC_PORT_RTP'), 
																										logLowLevelEvents=True, 
																										recordRcvSound=get('RECORD_SOUND'), 
																										recordSndSound=get('RECORD_SOUND'), 
																										defaultSound=SutAdapters.RTP.SOUND_WHITE_NOISE	, 
																										payloadType=SutLibraries.Codecs.A_G711U ) 

		self.rtp.startListening()
		rtpListening = self.rtp.isListening( timeout=get('TIMEOUT') )
		if not rtpListening:
			self.step1.setFailed( actual = "RTP not listening")
			self.abort()
		
		self.step1.setPassed( actual = "rtp is listenning and sip is ready")
	def cleanup(self, aborted):
		# stop rtp
		self.rtp.stopListening()		
		rtpStopped = self.rtp.isStopped( timeout=get('TIMEOUT') )
		if not rtpStopped:
			self.abort( 'RTP not stopped' )
				
	def definition(self):

		self.rtp.setCodec(payloadType=codec)
		self.rtp.setDestination(destinationIp=ipRtpDest, destinationPort=portRtpDest)		
	
		# start sending rtp
		self.rtp.startSending()
		
		if not self.rtp.hasStartedReceiving(timeout=get('TIMEOUT')):
			self.step1.setFailed( actual =  'no audio received' )
		else:
			self.info( 'audio received', bold=True )
			self.step1.setPassed( actual = 'audio received' )
	
		# wait
		self.wait( get('CALL_DURATION') ) 

		# stop sending rtp
		self.rtp.stopSending()			
]]></testdefinition>
<testexecution><![CDATA[
RTP_01(suffix=None).execute()]]></testexecution>
<testdevelopment>1561318923.39387</testdevelopment>
</file>