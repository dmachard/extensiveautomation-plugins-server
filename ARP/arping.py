#!/usr/bin/env python
# -*- coding: utf-8 -*-

# ------------------------------------------------------------------
# Copyright (c) 2010-2019 Denis Machard
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

import sys

from ea.testexecutorlib import TestValidatorsLib as TestValidatorsLib
from ea.testexecutorlib import TestTemplatesLib as TestTemplatesLib
from ea.testexecutorlib import TestOperatorsLib as TestOperatorsLib
from ea.testexecutorlib import TestAdapterLib as TestAdapterLib

from ea.sutadapters import Ethernet as AdapterEthernet
from ea.sutadapters.ARP import sniffer

__NAME__="""Arping"""

AGENT_TYPE_EXPECTED='socket'

class Arping(TestAdapterLib.Adapter):
	
	def __init__(self, parent, debug=False, name=None, shared=False, agentSupport=False, agent=None):
		"""
		This class enables to send arp request
		The lower layer is based on the ARP adapter.
	
		@param parent: parent testcase
		@type parent: testcase

		@param name: adapter name used with from origin/to destination (default=None)
		@type name: string/none
		
		@param debug: active debug mode (default=False)
		@type debug:	boolean
	
		@param shared: shared adapter (default=False)
		@type shared:	boolean	

		@param agentSupport: agent support to use a remote socket (default=False)
		@type agentSupport: boolean

		@param agent: agent to use when this mode is activated
		@type agent: string/None
		"""	
		# init adapter
		TestAdapterLib.Adapter.__init__(self, name = __NAME__, parent = parent, debug=debug, 
																									realname=name, agentSupport=agentSupport, agent=agent,
																									caller=TestAdapterLib.caller(),
																									agentType=AGENT_TYPE_EXPECTED)
		self.arp = sniffer.Sniffer(parent=parent, debug=debug, logEventSent=True, logEventReceived=True,
																		shared=shared, name=name, agentSupport=agentSupport, agent=agent)
		
		self.cfg = {}
		self.cfg['agent-support'] = agentSupport
		if agentSupport:
			self.cfg['agent'] = agent
			self.cfg['agent-name'] = agent['name']
		self.__checkConfig()
		
	def __checkConfig(self):
		"""
		private function
		"""
		self.debug("config: %s" % self.cfg)

	def onReset(self):
		"""
		Reset
		"""
		self.arp.stopListening()
		
	
	def ip(self, interface, sourceMac, sourceIp, destinationIp, timeout=1.0):
		"""
		Arping the destination ip passed as argument and wait a response.
		
		@param interface: network interface
		@type interface: string
		
		@param sourceMac: source mac
		@type sourceMac: string
		
		@param sourceIp: source ip
		@type sourceIp: string
		
		@param destinationIp: destination ip
		@type destinationIp: string
		
		@param timeout: time max to wait to receive event in second (default=1s)
		@type timeout: float
		
		@return: pong response
		@rtype: templatemessage
		"""
		TestAdapterLib.check_timeout(caller=TestAdapterLib.caller(), timeout=timeout)
		
		self.arp.startListening(eth=interface, srcMac=sourceMac )
		arpSniffing = self.arp.isSniffing( timeout=timeout )
		if not arpSniffing:
			raise Exception('failed to start arp')
		
		pong = self.arp.whoHas(targetIp=destinationIp, senderIp=sourceIp, timeout=timeout)
		
		self.arp.stopListening()
		arpStopped = self.arp.isStopped( timeout=timeout ) 
		if not arpStopped:
			raise Exception('failed to stop arp')	
		
		return pong